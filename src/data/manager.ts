import type {
  InventoryItem,
  Booking,
  Client,
  Invoice,
  Expense,
  DashboardMetrics,
  InvoiceItem,
} from '../types';
import { api } from '../lib/api';

const mapInventory = (item: any): InventoryItem => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  category: item.category,
  quantity: Number(item.quantity ?? 0),
  price: parseFloat(item.price ?? 0),
  cost: parseFloat(item.cost ?? 0),
  status: item.status ?? 'in-stock',
  lastUpdated: item.updated_at ?? new Date().toISOString(),
});

const mapBooking = (item: any): Booking => ({
  id: item.id,
  clientId: item.client_id || '',
  clientName: item.client_name,
  service: item.service,
  date: item.booking_date ? new Date(item.booking_date).toISOString().split('T')[0] : '',
  time: item.booking_time,
  duration: item.duration,
  status: item.status,
  amount: parseFloat(item.amount ?? 0),
  notes: item.notes,
});

const mapClient = (item: any): Client => ({
  id: item.id,
  name: item.name,
  email: item.email || '',
  phone: item.phone || '',
  company: item.company,
  totalSpent: parseFloat(item.total_spent ?? 0),
  bookingCount: Number(item.booking_count ?? 0),
  lastVisit: item.last_visit ? new Date(item.last_visit).toISOString().split('T')[0] : '',
  status: item.status,
  notes: item.notes,
});

const mapInvoice = (item: any): Invoice => ({
  id: item.id,
  invoiceNumber: item.invoice_number,
  clientId: item.client_id || '',
  clientName: item.client_name,
  items: (item.items as InvoiceItem[]) || [],
  subtotal: parseFloat(item.subtotal ?? 0),
  tax: parseFloat(item.tax ?? 0),
  discount: parseFloat(item.discount ?? 0),
  shipping: parseFloat(item.shipping ?? 0),
  total: parseFloat(item.total ?? 0),
  status: item.status,
  issueDate: item.issue_date ? new Date(item.issue_date).toISOString().split('T')[0] : '',
  dueDate: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
  notes: item.notes,
  ...(item.metadata || {}),
});

const mapExpense = (item: any): Expense => ({
  id: item.id,
  description: item.description,
  category: item.category,
  amount: parseFloat(item.amount ?? 0),
  date: item.expense_date ? new Date(item.expense_date).toISOString().split('T')[0] : '',
  vendor: item.vendor,
  status: item.status,
  receiptUrl: item.receipt_url,
  notes: item.notes,
});

export async function getInventory(): Promise<InventoryItem[]> {
  const data = await api.get<any[]>('/inventory_items');
  return data.map(mapInventory);
}

export async function addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const payload = {
    name: item.name,
    sku: item.sku,
    category: item.category,
    quantity: item.quantity,
    price: item.price,
    cost: item.cost,
    status: item.status,
  };
  const data = await api.post<any>('/inventory_items', payload);
  return mapInventory(data);
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.quantity !== undefined) payload.quantity = updates.quantity;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.cost !== undefined) payload.cost = updates.cost;
  if (updates.status !== undefined) payload.status = updates.status;

  const data = await api.put<any>(`/inventory_items/${id}`, payload);
  return mapInventory(data);
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  await api.delete(`/inventory_items/${id}`);
  return true;
}

export async function getBookings(): Promise<Booking[]> {
  const data = await api.get<any[]>('/bookings');
  return data.map(mapBooking);
}

export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
  const payload = {
    client_id: booking.clientId || null,
    client_name: booking.clientName,
    service: booking.service,
    booking_date: booking.date || null,
    booking_time: booking.time,
    duration: booking.duration,
    status: booking.status,
    amount: booking.amount,
    notes: booking.notes,
  };
  const data = await api.post<any>('/bookings', payload);
  return mapBooking(data);
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  const payload: any = {};
  if (updates.clientId !== undefined) payload.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.service !== undefined) payload.service = updates.service;
  if (updates.date !== undefined) payload.booking_date = updates.date || null;
  if (updates.time !== undefined) payload.booking_time = updates.time;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const data = await api.put<any>(`/bookings/${id}`, payload);
  return mapBooking(data);
}

export async function deleteBooking(id: string): Promise<boolean> {
  await api.delete(`/bookings/${id}`);
  return true;
}

export async function getClients(): Promise<Client[]> {
  const data = await api.get<any[]>('/clients');
  return data.map(mapClient);
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  const payload = {
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    total_spent: client.totalSpent,
    booking_count: client.bookingCount,
    last_visit: client.lastVisit || null,
    status: client.status,
    notes: client.notes,
  };
  const data = await api.post<any>('/clients', payload);
  return mapClient(data);
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.totalSpent !== undefined) payload.total_spent = updates.totalSpent;
  if (updates.bookingCount !== undefined) payload.booking_count = updates.bookingCount;
  if (updates.lastVisit !== undefined) payload.last_visit = updates.lastVisit || null;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const data = await api.put<any>(`/clients/${id}`, payload);
  return mapClient(data);
}

export async function deleteClient(id: string): Promise<boolean> {
  await api.delete(`/clients/${id}`);
  return true;
}

export async function getInvoices(): Promise<Invoice[]> {
  const data = await api.get<any[]>('/invoices');
  return data.map(mapInvoice);
}

export async function addInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
  const metadata = {
    clientSource: invoice.clientSource,
    clientAttention: invoice.clientAttention,
    clientAddress: invoice.clientAddress,
    issuerName: invoice.issuerName,
    issuerAddress: invoice.issuerAddress,
    issuerPhone: invoice.issuerPhone,
  };
  const payload = {
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId || null,
    client_name: invoice.clientName,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    discount: invoice.discount,
    shipping: invoice.shipping,
    total: invoice.total,
    status: invoice.status,
    issue_date: invoice.issueDate || null,
    due_date: invoice.dueDate || null,
    notes: invoice.notes,
    metadata,
  };

  const data = await api.post<any>('/invoices', payload);
  return mapInvoice(data);
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
  const payload: any = {};
  if (updates.invoiceNumber !== undefined) payload.invoice_number = updates.invoiceNumber;
  if (updates.clientId !== undefined) payload.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.items !== undefined) payload.items = updates.items;
  if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
  if (updates.tax !== undefined) payload.tax = updates.tax;
  if (updates.discount !== undefined) payload.discount = updates.discount;
  if (updates.shipping !== undefined) payload.shipping = updates.shipping;
  if (updates.total !== undefined) payload.total = updates.total;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.issueDate !== undefined) payload.issue_date = updates.issueDate || null;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const metadata = {
    clientSource: updates.clientSource,
    clientAttention: updates.clientAttention,
    clientAddress: updates.clientAddress,
    issuerName: updates.issuerName,
    issuerAddress: updates.issuerAddress,
    issuerPhone: updates.issuerPhone,
  };
  if (Object.values(metadata).some((value) => value !== undefined)) {
    payload.metadata = metadata;
  }

  const data = await api.put<any>(`/invoices/${id}`, payload);
  return mapInvoice(data);
}

export async function deleteInvoice(id: string): Promise<boolean> {
  await api.delete(`/invoices/${id}`);
  return true;
}

export async function getExpenses(): Promise<Expense[]> {
  const data = await api.get<any[]>('/expenses');
  return data.map(mapExpense);
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const payload = {
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    expense_date: expense.date || null,
    vendor: expense.vendor,
    status: expense.status,
    receipt_url: expense.receiptUrl,
    notes: expense.notes,
  };
  const data = await api.post<any>('/expenses', payload);
  return mapExpense(data);
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const payload: any = {};
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.date !== undefined) payload.expense_date = updates.date || null;
  if (updates.vendor !== undefined) payload.vendor = updates.vendor;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const data = await api.put<any>(`/expenses/${id}`, payload);
  return mapExpense(data);
}

export async function deleteExpense(id: string): Promise<boolean> {
  await api.delete(`/expenses/${id}`);
  return true;
}

export async function getSettings(): Promise<any> {
  return await api.get<any>('/settings');
}

export async function saveSettings(data: any): Promise<any> {
  return await api.put<any>('/settings', data);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return await api.get<DashboardMetrics>('/dashboard/metrics');
}