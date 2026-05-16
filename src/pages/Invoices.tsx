import { useMemo, useRef, useState, useEffect, type RefObject } from 'react';
import { Button, Card, Input, Modal, Select, Badge, Textarea, EmptyState } from '../components/ui';
import { getInvoices, addInvoice, updateInvoice, deleteInvoice, getClients } from '../data/manager';
import type { Invoice, InvoiceItem } from '../types';
import { formatCurrency, formatInvoiceDate } from '../utils/format';

type ClientSource = 'existing' | 'manual';

type InvoiceFormData = Omit<Invoice, 'id'> & {
  clientSource: ClientSource;
  clientAttention: string;
  clientAddress: string;
  issuerName: string;
  issuerAddress: string;
  issuerPhone: string;
  discount: number;
  shipping: number;
  notes: string;
};

const createBlankItem = (): InvoiceItem => ({
  id: crypto.randomUUID?.() ?? Date.now().toString(),
  description: '',
  quantity: 1,
  rate: 0,
  tax: 0,
  amount: 0,
});

function getNextInvoiceNumber(invoices: Invoice[]): string {
  return String(invoices.length + 1).padStart(3, '0');
}

function calculateTotals(items: InvoiceItem[], discount = 0, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = items.reduce((sum, item) => sum + (item.tax ?? 0), 0);
  const total = Math.max(subtotal - discount + tax + shipping, 0);
  return { subtotal, tax, total };
}

function buildBlankInvoice(invoices: Invoice[]): InvoiceFormData {
  const items = [createBlankItem()];
  const totals = calculateTotals(items);
  return {
    invoiceNumber: getNextInvoiceNumber(invoices),
    clientSource: 'manual',
    clientId: 'manual',
    clientName: '',
    clientAttention: '',
    clientAddress: '',
    issuerName: 'Marlon Reid',
    issuerAddress: '21 Lyndhurst Crescent Kingston 5',
    issuerPhone: '876-508-8476',
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: 0,
    shipping: 0,
    total: totals.total,
    status: 'draft',
    dueDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    notes: '',
  };
}

function normalizeInvoice(invoice: Invoice): InvoiceFormData {
  const normalizedItems = invoice.items.length > 0
    ? invoice.items.map((item) => ({ ...item, tax: item.tax ?? 0, amount: item.quantity * item.rate + (item.tax ?? 0) }))
    : [createBlankItem()];
  const discount = invoice.discount ?? 0;
  const shipping = invoice.shipping ?? 0;
  const totals = calculateTotals(normalizedItems, discount, shipping);
  return {
    invoiceNumber: invoice.invoiceNumber,
    clientSource: invoice.clientSource ?? (invoice.clientId === 'manual' ? 'manual' : 'existing'),
    clientId: invoice.clientId || 'manual',
    clientName: invoice.clientName || '',
    clientAttention: invoice.clientAttention ?? '',
    clientAddress: invoice.clientAddress ?? '',
    issuerName: invoice.issuerName ?? 'Marlon Reid',
    issuerAddress: invoice.issuerAddress ?? '21 Lyndhurst Crescent Kingston 5',
    issuerPhone: invoice.issuerPhone ?? '876-508-8476',
    items: normalizedItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount,
    shipping,
    total: totals.total,
    status: invoice.status,
    dueDate: invoice.dueDate,
    issueDate: invoice.issueDate,
    notes: invoice.notes ?? '',
  };
}

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(() => buildBlankInvoice([]));
  const [isExporting, setIsExporting] = useState(false);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    setRefreshing(true);
    Promise.allSettled([
      getInvoices().then((data) => {
        if (!mounted) return;
        setInvoices(data);
        if (data.length > 0 && !editingInvoice) {
          setFormData(buildBlankInvoice(data));
        }
      }),
      getClients().then((data) => { if (mounted) setClients(data); }),
    ]).finally(() => { if (mounted) setRefreshing(false); });
    return () => { mounted = false; };
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  const paidTotal = useMemo(() => invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0), [invoices]);
  const pendingTotal = useMemo(() => invoices.filter((invoice) => invoice.status === 'sent').reduce((sum, invoice) => sum + invoice.total, 0), [invoices]);
  const overdueTotal = useMemo(() => invoices.filter((invoice) => invoice.status === 'overdue').reduce((sum, invoice) => sum + invoice.total, 0), [invoices]);

  const updateFormWithTotals = (updates: Partial<InvoiceFormData>) => {
    setFormData((current) => {
      const next = { ...current, ...updates };
      const totals = calculateTotals(next.items, next.discount, next.shipping);
      return { ...next, ...totals };
    });
  };

  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData(normalizeInvoice(invoice));
    } else {
      setEditingInvoice(null);
      setFormData(buildBlankInvoice(invoices));
    }
    setIsModalOpen(true);
  };

  const handleClientSourceChange = (clientSource: ClientSource) => {
    if (clientSource === 'manual') {
      updateFormWithTotals({ clientSource, clientId: 'manual', clientName: '', clientAttention: '', clientAddress: '' });
    } else {
      updateFormWithTotals({ clientSource, clientId: '', clientName: '', clientAttention: '', clientAddress: '' });
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((candidate: any) => candidate.id === clientId);
    if (!client) {
      updateFormWithTotals({ clientId: '', clientName: '' });
      return;
    }
    updateFormWithTotals({
      clientId: client.id,
      clientName: client.name,
      clientAttention: client.company ? `Att: ${client.company}` : '',
      clientAddress: '',
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = formData.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const nextItem = { ...item, [field]: value };
      const quantity = Number(nextItem.quantity) || 0;
      const rate = Number(nextItem.rate) || 0;
      const tax = Number(nextItem.tax) || 0;
      return { ...nextItem, quantity, rate, tax, amount: quantity * rate + tax };
    });
    updateFormWithTotals({ items });
  };

  const addNewItem = () => {
    updateFormWithTotals({ items: [...formData.items, createBlankItem()] });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    updateFormWithTotals({ items: formData.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  const handleSubmit = async () => {
    if (!formData.clientName.trim()) {
      window.alert('Please select or type a client name before saving the invoice.');
      return;
    }
    const invoicePayload: Omit<Invoice, 'id'> = {
      ...formData,
      clientId: formData.clientSource === 'manual' ? 'manual' : formData.clientId,
      clientName: formData.clientName.trim(),
      items: formData.items.map((item) => ({
        ...item,
        description: item.description.trim(),
        amount: item.quantity * item.rate + (item.tax ?? 0),
      })),
    };
    try {
      if (editingInvoice) {
        const updated = await updateInvoice(editingInvoice.id, invoicePayload);
        if (updated) setInvoices(invoices.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
      } else {
        const newInvoice = await addInvoice(invoicePayload);
        setInvoices([...invoices, newInvoice]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save invoice', error);
      alert('Failed to save invoice.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
      } catch (error) {
        console.error('Failed to delete invoice', error);
      }
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPng = async () => {
    if (!invoicePreviewRef.current) return;
    try {
      setIsExporting(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoicePreviewRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `invoice-${formData.invoiceNumber || 'draft'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'sent': return <Badge variant="info">Sent</Badge>;
      case 'overdue': return <Badge variant="danger">Overdue</Badge>;
      case 'draft': return <Badge variant="neutral">Draft</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-content">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Invoices</h1>
            <p className="text-zinc-500 mt-1">Create printable JMD invoices and export them as PNG files</p>
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
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="!p-4"><p className="text-xs text-zinc-500 uppercase tracking-wider">Total Invoices</p><p className="text-2xl font-bold text-white mt-1">{invoices.length}</p></Card>
        <Card className="!p-4"><p className="text-xs text-zinc-500 uppercase tracking-wider">Paid</p><p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(paidTotal)}</p></Card>
        <Card className="!p-4"><p className="text-xs text-zinc-500 uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(pendingTotal)}</p></Card>
        <Card className="!p-4"><p className="text-xs text-zinc-500 uppercase tracking-wider">Overdue</p><p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(overdueTotal)}</p></Card>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <Input placeholder="Search invoices..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
          </div>
          <div className="w-full sm:w-48">
            <Select options={[{ value: 'all', label: 'All Status' }, { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} />
          </div>
        </div>
      </Card>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Create a JMD invoice, print it, or export it as a PNG." action={<Button onClick={() => handleOpenModal()}>New Invoice</Button>} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issued</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><span className="text-sm font-medium text-violet-400">{invoice.invoiceNumber}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-white">{invoice.clientName}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{formatInvoiceDate(invoice.issueDate)}</span></td>
                    <td className="px-6 py-4"><span className="text-sm text-zinc-400">{formatInvoiceDate(invoice.dueDate)}</span></td>
                    <td className="px-6 py-4"><span className="text-sm font-medium text-white">{formatCurrency(invoice.total)}</span></td>
                    <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(invoice)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Edit, print, or export">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(invoice.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors" title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingInvoice ? 'Edit Invoice' : 'New Invoice'} size="xl">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
          <div className="space-y-5">
            <Card className="!p-4" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-white">Invoice Details</h3><p className="text-xs text-zinc-500">Currency is fixed to JMD</p></div>
                <Badge variant="info">JMD</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Invoice #" value={formData.invoiceNumber} onChange={(event) => updateFormWithTotals({ invoiceNumber: event.target.value })} />
                <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} value={formData.status} onChange={(event) => updateFormWithTotals({ status: event.target.value as Invoice['status'] })} />
                <Input label="Issue Date" type="date" value={formData.issueDate} onChange={(event) => updateFormWithTotals({ issueDate: event.target.value })} />
                <Input label="Due Date" type="date" value={formData.dueDate} onChange={(event) => updateFormWithTotals({ dueDate: event.target.value })} />
              </div>
            </Card>
            <Card className="!p-4" hover={false}>
              <h3 className="mb-4 text-sm font-semibold text-white">Business Details</h3>
              <div className="space-y-4">
                <Input label="Name" value={formData.issuerName} onChange={(event) => updateFormWithTotals({ issuerName: event.target.value })} placeholder="Your business name" />
                <Input label="Address" value={formData.issuerAddress} onChange={(event) => updateFormWithTotals({ issuerAddress: event.target.value })} placeholder="Business address" />
                <Input label="Phone" value={formData.issuerPhone} onChange={(event) => updateFormWithTotals({ issuerPhone: event.target.value })} placeholder="Phone number" />
              </div>
            </Card>
            <Card className="!p-4" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Client</h3>
                <div className="flex rounded-xl bg-white/[0.04] p-1">
                  <button type="button" onClick={() => handleClientSourceChange('existing')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${formData.clientSource === 'existing' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'}`}>Select</button>
                  <button type="button" onClick={() => handleClientSourceChange('manual')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${formData.clientSource === 'manual' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'}`}>Manual</button>
                </div>
              </div>
              <div className="space-y-4">
                {formData.clientSource === 'existing' ? (
                  <Select label="Client Name" options={[{ value: '', label: clients.length ? 'Select a client' : 'No saved clients yet' }, ...clients.map((client: any) => ({ value: client.id, label: client.name }))]} value={formData.clientId === 'manual' ? '' : formData.clientId} onChange={(event) => handleClientSelect(event.target.value)} disabled={clients.length === 0} />
                ) : (
                  <Input label="Client Name" value={formData.clientName} onChange={(event) => updateFormWithTotals({ clientId: 'manual', clientName: event.target.value })} placeholder="Type client or company name" />
                )}
                <Input label="Attention / Contact" value={formData.clientAttention} onChange={(event) => updateFormWithTotals({ clientAttention: event.target.value })} placeholder="Att: Mrs Buddan" />
                <Textarea label="Client Address / Details" rows={2} value={formData.clientAddress} onChange={(event) => updateFormWithTotals({ clientAddress: event.target.value })} placeholder="Optional address or billing details" />
              </div>
            </Card>
            <Card className="!p-4" hover={false}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Line Items</h3>
                <Button variant="ghost" size="sm" onClick={addNewItem}>Add Item</Button>
              </div>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_80px_110px_110px_36px]">
                      <Input placeholder="Item description" value={item.description} onChange={(event) => handleItemChange(index, 'description', event.target.value)} />
                      <Input type="number" min="0" placeholder="Qty" value={item.quantity} onChange={(event) => handleItemChange(index, 'quantity', Number(event.target.value) || 0)} />
                      <Input type="number" min="0" step="0.01" placeholder="Price" value={item.rate} onChange={(event) => handleItemChange(index, 'rate', Number(event.target.value) || 0)} />
                      <Input type="number" min="0" step="0.01" placeholder="Tax" value={item.tax ?? 0} onChange={(event) => handleItemChange(index, 'tax', Number(event.target.value) || 0)} />
                      <button type="button" onClick={() => removeItem(index)} className="flex h-11 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400" title="Remove item">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="mt-2 text-right text-xs text-zinc-500">Line total: {formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="!p-4" hover={false}>
              <h3 className="mb-4 text-sm font-semibold text-white">Adjustments</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Discount" type="number" min="0" step="0.01" value={formData.discount} onChange={(event) => updateFormWithTotals({ discount: Number(event.target.value) || 0 })} />
                <Input label="Shipping" type="number" min="0" step="0.01" value={formData.shipping} onChange={(event) => updateFormWithTotals({ shipping: Number(event.target.value) || 0 })} />
              </div>
              <Textarea label="Notes" className="mt-4" rows={3} value={formData.notes} onChange={(event) => updateFormWithTotals({ notes: event.target.value })} placeholder="Optional invoice notes" />
            </Card>
          </div>
          <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
              <div><p className="text-sm font-semibold text-white">Invoice Preview</p><p className="text-xs text-zinc-500">Print dialog or PNG export uses this document</p></div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handlePrint}>Print</Button>
                <Button size="sm" onClick={handleDownloadPng} isLoading={isExporting}>Download PNG</Button>
              </div>
            </div>
            <div className="overflow-auto rounded-2xl bg-zinc-950/60 p-3 ring-1 ring-white/[0.06]">
              <InvoiceDocument invoice={formData} invoiceRef={invoicePreviewRef} />
            </div>
            <div className="flex justify-end gap-3 no-print">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InvoiceDocument({ invoice, invoiceRef }: { invoice: InvoiceFormData; invoiceRef: RefObject<HTMLDivElement | null> }) {
  const balanceDue = invoice.total;
  return (
    <div ref={invoiceRef} className="invoice-print-area mx-auto w-[840px] min-h-[1080px] bg-white px-10 py-12 text-[#373941] shadow-2xl">
      <div className="flex items-start justify-between gap-10">
        <div className="max-w-[360px] whitespace-pre-line pt-7 text-[15px] leading-tight text-[#373941]">
          <p>{invoice.issuerName || 'Business Name'}</p>
          <p>{invoice.issuerAddress || 'Business address'}</p>
          <p>{invoice.issuerPhone || 'Phone number'}</p>
        </div>
        <h2 className="text-[54px] font-light leading-none tracking-tight text-[#30323a]">Invoice</h2>
      </div>
      <div className="mt-28 min-h-[94px] whitespace-pre-line text-[15px] leading-tight text-[#373941]">
        <p>{invoice.clientName || 'Client Name'}</p>
        {invoice.clientAttention && <p>{invoice.clientAttention}</p>}
        {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
      </div>
      <div className="mt-20 border-t border-[#d9dce5] pt-4">
        <div className="grid grid-cols-[1fr_300px] gap-10">
          <div className="space-y-1 text-[15px] leading-snug">
            <div className="grid grid-cols-[110px_1fr] gap-3"><span className="text-[#8b93a6]">Invoice #:</span><span>{invoice.invoiceNumber || '001'}</span></div>
            <div className="grid grid-cols-[110px_1fr] gap-3"><span className="text-[#8b93a6]">Issued:</span><span>{formatInvoiceDate(invoice.issueDate)}</span></div>
            <div className="grid grid-cols-[110px_1fr] gap-3"><span className="text-[#8b93a6]">Due:</span><span>{formatInvoiceDate(invoice.dueDate)}</span></div>
          </div>
          <div className="text-right">
            <p className="text-[15px] text-[#8b93a6]">Invoice Total:</p>
            <p className="mt-1 text-[39px] font-extrabold leading-none tracking-tight text-[#30323a]">{formatCurrency(balanceDue)}</p>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="grid grid-cols-[1fr_110px_110px_110px_110px] bg-[#687081] text-white">
          <div className="px-3 py-3 text-[13px] font-extrabold tracking-wider">Item Description</div>
          <div className="border-l border-white/10 px-3 py-3 text-right text-[13px] font-extrabold tracking-wider">Price</div>
          <div className="border-l border-white/10 px-3 py-3 text-center text-[13px] font-extrabold tracking-wider">Quantity</div>
          <div className="border-l border-white/10 px-3 py-3 text-right text-[13px] font-extrabold tracking-wider">Tax</div>
          <div className="border-l border-white/10 px-3 py-3 text-right text-[13px] font-extrabold tracking-wider">Total</div>
        </div>
        {invoice.items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_110px_110px_110px_110px] border-b border-[#e6e8ef] py-4 text-[15px]">
            <div className="px-3 font-extrabold">{item.description || 'Item description'}</div>
            <div className="px-3 text-right">{formatCurrency(item.rate)}</div>
            <div className="px-3 text-center">{item.quantity}</div>
            <div className="px-3 text-right">{formatCurrency(item.tax ?? 0)}</div>
            <div className="px-3 text-right">{formatCurrency(item.amount)}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-[1fr_330px] gap-12">
        <div>
          <h3 className="text-[19px] font-extrabold tracking-wide">Notes:</h3>
          <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[#555b66]">{invoice.notes}</p>
        </div>
        <div className="space-y-5 text-[15px]">
          <InvoiceTotalRow label="Subtotal" value={invoice.subtotal} />
          <InvoiceTotalRow label="Discount" value={invoice.discount} />
          <InvoiceTotalRow label="Tax" value={invoice.tax} />
          <InvoiceTotalRow label="Shipping" value={invoice.shipping} />
          <div className="border-t border-[#e6e8ef] pt-5">
            <div className="flex items-baseline justify-between gap-6">
              <span className="text-[20px] font-extrabold">Balance Due</span>
              <span className="text-[23px] font-extrabold">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceTotalRow({ label, value = 0 }: { label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="font-extrabold tracking-wide">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}