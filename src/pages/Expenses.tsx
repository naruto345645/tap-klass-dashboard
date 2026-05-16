import { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Modal, Select, Badge, EmptyState } from '../components/ui';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../data/manager';
import type { Expense } from '../types';
import { formatCurrency } from '../utils/format';

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: 0,
    date: '',
    vendor: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    receiptUrl: '',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    getExpenses()
      .then((data) => { if (mounted) setExpenses(data); })
      .catch((error) => console.warn('Failed to load expenses', error))
      .finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.vendor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchQuery, filterStatus]);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        vendor: expense.vendor,
        status: expense.status,
        receiptUrl: expense.receiptUrl || '',
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        category: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        status: 'pending',
        receiptUrl: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingExpense) {
        const updated = await updateExpense(editingExpense.id, formData);
        if (updated) {
          setExpenses(expenses.map(e => e.id === updated.id ? updated : e));
        }
      } else {
        const newExpense = await addExpense(formData);
        setExpenses([...expenses, newExpense]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save expense', error);
      alert('Failed to save expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (error) {
        console.error('Failed to delete expense', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Expenses</h1>
            <p className="text-zinc-500 mt-1">Track your business expenses</p>
          </div>
          {refreshing && (
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
              Syncing
            </span>
          )}
        </div>
        <Button onClick={() => handleOpenModal()}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0))}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0))}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(expenses.filter(e => e.status === 'rejected').reduce((sum, e) => sum + e.amount, 0))}</p>
        </Card>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add your first expense to start tracking costs."
          action={<Button onClick={() => handleOpenModal()}>Add Expense</Button>}
        />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{expense.description}</p>
                      {expense.notes && <p className="text-xs text-zinc-500">{expense.notes}</p>}
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{expense.category}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{expense.vendor}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{expense.date}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-white">{formatCurrency(expense.amount)}</span></td>
                    <td className="px-6 py-4">{getStatusBadge(expense.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(expense)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? 'Edit Expense' : 'Add Expense'} size="lg">
        <div className="space-y-4">
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What was this for?" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Supplies" />
            <Input label="Vendor" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="Who did you pay?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
            <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          />
          <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingExpense ? 'Save Changes' : 'Add Expense'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}