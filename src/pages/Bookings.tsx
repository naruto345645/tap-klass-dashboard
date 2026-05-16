import { useState, useEffect, useMemo } from 'react';
import { Button, Card, Input, Modal, Select, Badge, EmptyState } from '../components/ui';
import { getBookings, addBooking, updateBooking, deleteBooking, getClients } from '../data/manager';
import type { Booking } from '../types';
import { formatCurrency } from '../utils/format';

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    service: '',
    date: '',
    time: '',
    duration: '1 hour',
    status: 'pending' as 'confirmed' | 'pending' | 'completed' | 'cancelled',
    amount: 0,
    notes: '',
  });
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    Promise.allSettled([
      getBookings().then((data) => { if (mounted) setBookings(data); }),
      getClients().then((data) => { if (mounted) setClients(data); }),
    ]).finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, filterStatus]);

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      setFormData({
        clientId: booking.clientId,
        clientName: booking.clientName,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        status: booking.status,
        amount: booking.amount,
        notes: booking.notes || '',
      });
    } else {
      setEditingBooking(null);
      setFormData({
        clientId: '',
        clientName: '',
        service: '',
        date: '',
        time: '',
        duration: '1 hour',
        status: 'pending',
        amount: 0,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({
        ...formData,
        clientId: client.id,
        clientName: client.name,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingBooking) {
        const updated = await updateBooking(editingBooking.id, formData);
        if (updated) {
          setBookings(bookings.map(b => b.id === updated.id ? updated : b));
        }
      } else {
        const newBooking = await addBooking(formData);
        setBookings([...bookings, newBooking]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save booking', error);
      alert('Failed to save booking.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBooking(id);
        setBookings(bookings.filter(b => b.id !== id));
      } catch (error) {
        console.error('Failed to delete booking', error);
      }
    }
  };

  const handleQuickStatus = async (id: string, status: Booking['status']) => {
    try {
      const updated = await updateBooking(id, { status });
      if (updated) {
        setBookings(bookings.map(b => b.id === updated.id ? updated : b));
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="success">Confirmed</Badge>;
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'completed': return <Badge variant="info">Completed</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-content">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Bookings</h1>
            <p className="text-zinc-500 mt-1">Manage your appointments and schedule</p>
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
          New Booking
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search bookings..."
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
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Create your first booking to get started."
          action={<Button onClick={() => handleOpenModal()}>New Booking</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="!p-0">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{booking.clientName}</p>
                      <p className="text-xs text-zinc-500">{booking.service}</p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{booking.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{booking.time} • {booking.duration}</span>
                  </div>
                  {booking.amount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-white font-medium">{formatCurrency(booking.amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.06] p-4 flex items-center justify-between">
                <div className="flex gap-1">
                  {booking.status === 'pending' && (
                    <button onClick={() => handleQuickStatus(booking.id, 'confirmed')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Confirm</button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button onClick={() => handleQuickStatus(booking.id, 'completed')} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">Complete</button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenModal(booking)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(booking.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBooking ? 'Edit Booking' : 'New Booking'} size="lg">
        <div className="space-y-4">
          <Select
            label="Client"
            options={[
              { value: '', label: 'Select a client' },
              ...clients.map(c => ({ value: c.id, label: c.name })),
            ]}
            value={formData.clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          />
          <Input label="Service" value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} placeholder="Service type" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <Input label="Time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="1 hour" />
            <Input label="Amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingBooking ? 'Save Changes' : 'Create Booking'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}