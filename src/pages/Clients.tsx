import { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Modal, Select, Badge, EmptyState } from '../components/ui';
import { getClients, addClient, updateClient, deleteClient } from '../data/manager';
import type { Client } from '../types';
import { formatCurrency } from '../utils/format';

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    totalSpent: 0,
    bookingCount: 0,
    lastVisit: '',
    status: 'active' as 'active' | 'inactive' | 'lead',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    getClients()
      .then((data) => { if (mounted) setClients(data); })
      .catch((error) => console.warn('Failed to load clients', error))
      .finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, filterStatus]);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company || '',
        totalSpent: client.totalSpent,
        bookingCount: client.bookingCount,
        lastVisit: client.lastVisit,
        status: client.status,
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        totalSpent: 0,
        bookingCount: 0,
        lastVisit: '',
        status: 'active',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, formData);
        if (updated) {
          setClients(clients.map(c => c.id === updated.id ? updated : c));
        }
      } else {
        const newClient = await addClient(formData);
        setClients([...clients, newClient]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save client', error);
      alert('Failed to save client.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
        setClients(clients.filter(c => c.id !== id));
      } catch (error) {
        console.error('Failed to delete client', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'inactive': return <Badge variant="neutral">Inactive</Badge>;
      case 'lead': return <Badge variant="info">Lead</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Clients</h1>
            <p className="text-zinc-500 mt-1">Manage your client relationships</p>
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
          Add Client
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search clients..."
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
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'lead', label: 'Lead' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client to start building relationships."
          action={<Button onClick={() => handleOpenModal()}>Add Client</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="!p-0">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/20">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{client.name}</p>
                      {client.company && <p className="text-xs text-zinc-500">{client.company}</p>}
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Spent</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(client.totalSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Bookings</p>
                    <p className="text-sm font-semibold text-white">{client.bookingCount}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06] p-4 flex items-center justify-end gap-2">
                <button onClick={() => handleOpenModal(client)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(client.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add Client'} size="lg">
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Client name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
          </div>
          <Input label="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Last Visit" type="date" value={formData.lastVisit} onChange={(e) => setFormData({ ...formData, lastVisit: e.target.value })} />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'lead', label: 'Lead' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingClient ? 'Save Changes' : 'Add Client'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}