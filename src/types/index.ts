// ============================================
// TAP KLASS - Premium Dashboard Types
// ============================================

// Navigation Types
export type PageId = 
  | 'dashboard'
  | 'inventory'
  | 'bookings'
  | 'clients'
  | 'invoices'
  | 'expenses'
  | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  cost: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

// Booking Types
export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  amount: number;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalSpent: number;
  bookingCount: number;
  lastVisit: string;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
}

// Invoice Types
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  tax?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientSource?: 'existing' | 'manual';
  clientId: string;
  clientName: string;
  clientAttention?: string;
  clientAddress?: string;
  issuerName?: string;
  issuerAddress?: string;
  issuerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  shipping?: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  issueDate: string;
  notes?: string;
}

// Expense Types
export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
  notes?: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  activeClients: number;
  pendingBookings: number;
  inventoryItems: number;
  unpaidInvoices: number;
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Modal Types
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: any;
}

// State Types
export interface AppState {
  currentPage: PageId;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toasts: Toast[];
  modal: ModalState;
  isInitialized: boolean;
}
