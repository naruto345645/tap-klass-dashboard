import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 8080;
const workspaceEmail = 'joel@tapklass.app';
const workspaceName = 'Joel';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

// Core mechanism: Make sure the workspace user is always present, use ON CONFLICT
// Since concurrent API calls (like dashboard loading) can hit this at the exact same time,
// we use a single query that inserts or returns the existing ID safely.
async function ensureWorkspaceUser() {
  const query = `
    WITH ins AS (
      INSERT INTO app_users (name, email, password_hash, role)
      VALUES ($1, $2, 'passive-access-no-login', 'owner')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role
    )
    SELECT id, name, email, role FROM ins
    UNION ALL
    SELECT id, name, email, role FROM app_users WHERE email = $2
    LIMIT 1;
  `;
  const result = await pool.query(query, [workspaceName, workspaceEmail]);
  return result.rows[0];
}

// Single middleware to inject the default user into all requests
async function attachWorkspaceUser(req, res, next) {
  try {
    req.user = await ensureWorkspaceUser();
    next();
  } catch (error) {
    console.error('Workspace User Error:', error);
    res.status(500).json({ message: 'Internal error resolving workspace.' });
  }
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, service: 'tap-klass-api' });
});

// --- Generic CRUD Helper using default workspace user ---
function createCrudRoutes(tableName, idColumn = 'id') {
  app.get(`/api/${tableName}`, attachWorkspaceUser, async (req, res) => {
    try {
      const result = await pool.query(`select * from ${tableName} where user_id = $1 order by created_at desc`, [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      console.error(`GET /api/${tableName} error:`, error);
      res.status(500).json({ message: 'Fetch failed', error: error.message });
    }
  });

  app.post(`/api/${tableName}`, attachWorkspaceUser, async (req, res) => {
    const data = req.body;
    const keys = Object.keys(data).filter((key) => key !== 'id');
    const values = keys.map((key) => data[key]);
    const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');
    const query = `insert into ${tableName} (user_id, ${keys.join(', ')}) values ($1, ${placeholders}) returning *`;
    try {
      const result = await pool.query(query, [req.user.id, ...values]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(`POST /api/${tableName} error:`, error);
      res.status(500).json({ message: 'Create failed', error: error.message });
    }
  });

  app.put(`/api/${tableName}/:id`, attachWorkspaceUser, async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const keys = Object.keys(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map((key) => data[key]);
    const query = `update ${tableName} set ${setClause}, updated_at = now() where ${idColumn} = $1 and user_id = $${values.length + 2} returning *`;
    try {
      const result = await pool.query(query, [id, ...values, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error(`PUT /api/${tableName}/:id error:`, error);
      res.status(500).json({ message: 'Update failed', error: error.message });
    }
  });

  app.delete(`/api/${tableName}/:id`, attachWorkspaceUser, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`delete from ${tableName} where ${idColumn} = $1 and user_id = $2 returning *`, [id, req.user.id]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      res.json({ ok: true });
    } catch (error) {
      console.error(`DELETE /api/${tableName}/:id error:`, error);
      res.status(500).json({ message: 'Delete failed', error: error.message });
    }
  });
}

createCrudRoutes('inventory_items', 'id');
createCrudRoutes('clients', 'id');
createCrudRoutes('bookings', 'id');
createCrudRoutes('invoices', 'id');
createCrudRoutes('expenses', 'id');

app.get('/api/settings', attachWorkspaceUser, async (req, res) => {
  try {
    const result = await pool.query('select data from settings where user_id = $1', [req.user.id]);
    res.json(result.rows[0]?.data || {});
  } catch (error) {
    console.error('GET /api/settings error:', error);
    res.status(500).json({ message: 'Fetch settings failed' });
  }
});

app.put('/api/settings', attachWorkspaceUser, async (req, res) => {
  try {
    const result = await pool.query(
      'insert into settings (user_id, data) values ($1, $2) on conflict (user_id) do update set data = $2, updated_at = now() returning data',
      [req.user.id, req.body]
    );
    res.json(result.rows[0].data);
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    res.status(500).json({ message: 'Save settings failed' });
  }
});

app.get('/api/dashboard/metrics', attachWorkspaceUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const [inventoryRes, bookingsRes, clientsRes, unpaidRes, expensesRes, revenueRes] = await Promise.all([
      pool.query('select count(*) as count from inventory_items where user_id = $1', [userId]),
      pool.query('select count(*) as count from bookings where user_id = $1 and status = $2', [userId, 'pending']),
      pool.query('select count(*) as count from clients where user_id = $1 and status = $2', [userId, 'active']),
      pool.query('select count(*) as count from invoices where user_id = $1 and status != $2', [userId, 'paid']),
      pool.query('select coalesce(sum(amount), 0) as total from expenses where user_id = $1 and status = $2', [userId, 'approved']),
      pool.query('select coalesce(sum(total), 0) as total from invoices where user_id = $1 and status = $2', [userId, 'paid'])
    ]);

    res.json({
      inventoryItems: parseInt(inventoryRes.rows[0].count, 10),
      pendingBookings: parseInt(bookingsRes.rows[0].count, 10),
      activeClients: parseInt(clientsRes.rows[0].count, 10),
      unpaidInvoices: parseInt(unpaidRes.rows[0].count, 10),
      totalExpenses: parseFloat(expensesRes.rows[0].total),
      totalRevenue: parseFloat(revenueRes.rows[0].total),
    });
  } catch (error) {
    console.error('GET /api/dashboard/metrics error:', error);
    res.status(500).json({ message: 'Metrics fetch failed', error: error.message });
  }
});

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

app.listen(port, () => console.log(`TAP KLASS API running on port ${port}`));