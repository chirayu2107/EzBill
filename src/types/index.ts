export interface InvoiceItem {
  id: string;
  name: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  lineTotal: number;
}

export interface GSTBreakdown {
  isInterState: boolean;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  customerState: string;
  customerGSTIN: string;
  customerPAN: string;
  date: Date;
  items: InvoiceItem[];
  subtotal: number;
  gst: number;
  gstBreakdown: GSTBreakdown;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue';
  createdAt: Date;
}

export interface DashboardSummary {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  panNumber?: string;
  address?: string;
  state?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  gstNumber?: string;
  invoicePrefix?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  gstNumber?: string;
}