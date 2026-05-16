create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  sku text not null,
  category text not null,
  quantity integer not null default 0,
  price numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null default 0,
  status text not null default 'in-stock' check (status in ('in-stock', 'low-stock', 'out-of-stock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  total_spent numeric(12, 2) not null default 0,
  booking_count integer not null default 0,
  last_visit date,
  status text not null default 'active' check (status in ('active', 'inactive', 'lead')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  service text not null,
  booking_date date not null,
  booking_time text not null,
  duration text not null,
  status text not null default 'pending' check (status in ('confirmed', 'pending', 'completed', 'cancelled')),
  amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  invoice_number text not null,
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  issue_date date not null,
  due_date date not null,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(12, 2) not null default 0,
  expense_date date not null,
  vendor text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  receipt_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  user_id uuid primary key references app_users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists inventory_user_idx on inventory_items(user_id);
create index if not exists clients_user_idx on clients(user_id);
create index if not exists bookings_user_idx on bookings(user_id);
create index if not exists invoices_user_idx on invoices(user_id);
create index if not exists expenses_user_idx on expenses(user_id);