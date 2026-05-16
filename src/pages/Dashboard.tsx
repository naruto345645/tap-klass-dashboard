import { useState, useEffect } from 'react';
import { Card } from '../components/ui';
import { getDashboardMetrics, getBookings, getInvoices, getInventory, getExpenses, getClients } from '../data/manager';
import { formatCurrency } from '../utils/format';
import type { Expense, Invoice } from '../types';

const EMPTY_METRICS = { totalRevenue: 0, totalExpenses: 0, activeClients: 0, pendingBookings: 0, inventoryItems: 0, unpaidInvoices: 0 };

export function Dashboard() {
  const [metrics, setMetrics] = useState<any>(EMPTY_METRICS);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setRefreshing(true);
      const tasks: Promise<void>[] = [
        getDashboardMetrics().then((value) => { if (mounted) setMetrics(value); }).catch(() => {}),
        getBookings().then((value) => { if (mounted) setBookings(value); }).catch(() => {}),
        getInvoices().then((value) => { if (mounted) setInvoices(value); }).catch(() => {}),
        getInventory().then((value) => { if (mounted) setInventory(value); }).catch(() => {}),
        getExpenses().then((value) => { if (mounted) setExpenses(value); }).catch(() => {}),
        getClients().then((value) => { if (mounted) setClients(value); }).catch(() => {}),
      ];

      await Promise.allSettled(tasks);
      if (mounted) setRefreshing(false);
    }

    loadAll();
    return () => { mounted = false; };
  }, []);

  const upcomingBookings = bookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed').slice(0, 4);
  const recentInvoices = invoices.slice(0, 4);
  const outstanding = invoices.filter((invoice: any) => invoice.status !== 'paid').reduce((sum: number, invoice: any) => sum + invoice.total, 0);

  return (
    <div className="space-y-8 page-content">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome to your command center</p>
        </div>
        {refreshing && (
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Syncing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} change={`${invoices.filter((i: any) => i.status === 'paid').length} paid`} positive icon={<MoneyIcon />} color="emerald" />
        <MetricCard title="Total Expenses" value={formatCurrency(metrics.totalExpenses)} change={`${expenses.filter((e: any) => e.status === 'approved').length} approved`} positive={false} icon={<CardIcon />} color="rose" />
        <MetricCard title="Active Clients" value={metrics.activeClients.toString()} change={`${clients.length} total`} positive icon={<UsersIcon />} color="violet" />
        <MetricCard title="Pending Bookings" value={metrics.pendingBookings.toString()} change={`${bookings.length} total`} positive icon={<CalendarIcon />} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr] gap-6">
        <FinancialPie3D revenue={metrics.totalRevenue} expenses={metrics.totalExpenses} outstanding={outstanding} />
        <CashflowLine3D invoices={invoices} expenses={expenses} />
      </div>

      <OperationalBars3D
        data={[
          { label: 'Inventory', value: inventory.length, color: '#8b5cf6' },
          { label: 'Bookings', value: bookings.length, color: '#f59e0b' },
          { label: 'Clients', value: clients.length, color: '#10b981' },
          { label: 'Invoices', value: invoices.length, color: '#06b6d4' },
          { label: 'Expenses', value: expenses.length, color: '#f43f5e' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Upcoming Bookings</h2>
          </div>
          <div className="space-y-3">
            {upcomingBookings.length > 0 ? upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400"><UsersIcon /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{booking.clientName}</p>
                  <p className="text-xs text-zinc-500">{booking.service} - {booking.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{booking.date}</p>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{booking.status}</span>
                </div>
              </div>
            )) : <p className="text-center text-zinc-500 py-8">No upcoming bookings</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          </div>
          <div className="space-y-3">
            {recentInvoices.length > 0 ? recentInvoices.map((invoice: any) => (
              <div key={invoice.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400"><InvoiceIcon /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{invoice.clientName}</p>
                  <p className="text-xs text-zinc-500">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(invoice.total)}</p>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : invoice.status === 'overdue' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>{invoice.status}</span>
                </div>
              </div>
            )) : <p className="text-center text-zinc-500 py-8">No recent invoices</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FinancialPie3D({ revenue, expenses, outstanding }: { revenue: number; expenses: number; outstanding: number }) {
  const total = revenue + expenses + outstanding;
  const revenueAngle = total ? (revenue / total) * 360 : 0;
  const expensesAngle = total ? (expenses / total) * 360 : 0;
  const pieStyle = total
    ? { background: `conic-gradient(#10b981 0deg ${revenueAngle}deg, #f43f5e ${revenueAngle}deg ${revenueAngle + expensesAngle}deg, #06b6d4 ${revenueAngle + expensesAngle}deg 360deg)` }
    : { background: 'conic-gradient(rgba(139,92,246,0.18), rgba(6,182,212,0.12), rgba(255,255,255,0.06), rgba(139,92,246,0.18))' };

  return (
    <Card glow>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-48 w-48 shrink-0 [perspective:900px]">
          <div className="absolute inset-x-5 bottom-0 h-10 rounded-full bg-black/50 blur-xl" />
          <div className="analytics-pie-3d absolute inset-4" style={pieStyle}><div className="absolute inset-9 rounded-full bg-[#111118] shadow-inner shadow-black/60" /></div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Financial Mix</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Cash composition</h2>
          <p className="mt-2 text-sm text-zinc-500">Paid revenue, approved expenses, and outstanding invoice totals.</p>
          <div className="mt-5 space-y-3">
            <Legend label="Paid revenue" value={formatCurrency(revenue)} color="bg-emerald-400" />
            <Legend label="Approved expenses" value={formatCurrency(expenses)} color="bg-rose-400" />
            <Legend label="Outstanding invoices" value={formatCurrency(outstanding)} color="bg-cyan-400" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CashflowLine3D({ invoices, expenses }: { invoices: Invoice[]; expenses: Expense[] }) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: date.toLocaleDateString('en-JM', { month: 'short' }) };
  });
  const series = months.map((month) => {
    const revenue = invoices.filter((invoice: any) => invoice.issueDate?.startsWith(month.key)).reduce((sum: number, invoice: any) => sum + invoice.total, 0);
    const spent = expenses.filter((expense: any) => expense.date?.startsWith(month.key)).reduce((sum: number, expense: any) => sum + expense.amount, 0);
    return { ...month, net: revenue - spent };
  });
  const values = series.map((point: any) => point.net);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const points = series.map((point: any, index: number) => ({ ...point, x: 8 + (index / Math.max(series.length - 1, 1)) * 84, y: 88 - ((point.net - min) / range) * 72 }));
  const pointString = points.map((point: any) => `${point.x},${point.y}`).join(' ');

  return (
    <Card glow>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Cashflow</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Net movement</h2>
          <p className="mt-2 text-sm text-zinc-500">Monthly net line: invoice totals minus expense totals.</p>
        </div>
      </div>
      <div className="analytics-line-3d relative h-64 rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <defs><linearGradient id="cashLine" x1="0" x2="1" y1="0" y2="0"><stop stopColor="#8b5cf6" /><stop offset="0.5" stopColor="#06b6d4" /><stop offset="1" stopColor="#10b981" /></linearGradient></defs>
          {[20, 40, 60, 80].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />)}
          <polyline points={pointString} fill="none" stroke="url(#cashLine)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point: any) => <g key={point.key}><circle cx={point.x} cy={point.y} r="2.4" fill="#0a0a0f" stroke="#22d3ee" strokeWidth="1.2" /><text x={point.x} y="98" textAnchor="middle" fill="rgba(212,212,216,0.68)" fontSize="4">{point.label}</text></g>)}
        </svg>
      </div>
    </Card>
  );
}

function OperationalBars3D({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <Card glow>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Operations</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Module activity</h2>
      </div>
      <div className="grid min-h-[220px] grid-cols-2 gap-4 sm:grid-cols-5">
        {data.map((item) => {
          const height = item.value === 0 ? 8 : Math.max(18, (item.value / max) * 150);
          return <div key={item.label} className="flex flex-col items-center justify-end gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4"><div className="flex h-40 items-end"><div className="analytics-bar-3d relative w-12 rounded-t-xl" style={{ height, background: `linear-gradient(180deg, ${item.color}, rgba(15,15,20,0.88))` }}><span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-black/40 px-2 py-1 text-xs font-semibold text-white ring-1 ring-white/10">{item.value}</span></div></div><p className="text-center text-sm font-medium text-zinc-300">{item.label}</p></div>;
        })}
      </div>
    </Card>
  );
}

function Legend({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-3 py-2"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="text-sm text-zinc-300">{label}</span></div><p className="text-sm font-semibold text-white">{value}</p></div>;
}

function MetricCard({ title, value, change, positive, icon, color }: { title: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: 'emerald' | 'rose' | 'violet' | 'amber' }) {
  const colorClasses = { emerald: 'bg-emerald-500/20 text-emerald-400', rose: 'bg-rose-500/20 text-rose-400', violet: 'bg-violet-500/20 text-violet-400', amber: 'bg-amber-500/20 text-amber-400' };
  return <div className="metric-card"><div className="flex items-start justify-between mb-4"><div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>{icon}</div><span className={`text-xs font-medium px-2 py-1 rounded-lg ${positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>{change}</span></div><p className="text-2xl font-bold text-white mb-1">{value}</p><p className="text-sm text-zinc-500">{title}</p></div>;
}

function MoneyIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v-1" /></svg>; }
function CardIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function UsersIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 7a3 3 0 110 6 3 3 0 010-6z" /></svg>; }
function CalendarIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function InvoiceIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }