export interface InvoiceItem {
  id: string
  name: string
  hsnSac: string
  quantity: number
  rate: number
  unit?: string
  discount?: number
  lineTotal: number
}

export interface GSTBreakdown {
  isInterState: boolean
  igst: number
  cgst: number
  sgst: number
  total: number
}

export type InvoiceType = "standard" | "glass"

export interface GlassItem {
  id: string
  srNo?: number
  itemNo?: string
  actualWidth: number // in mm
  actualHeight: number // in mm
  actualInches?: string // e.g. "83 2/8 * 42 0/0"
  pcs: number
  actualSqms: number
  drgHolesNotes?: string // e.g. "DRG Holes: 4" or "SZE"
  chargedWidth: number // in mm
  chargedHeight: number // in mm
  chargedSqms: number
  chargedRefNotes?: string // e.g. "Ref.-" or "Cutout 3 Ref.-"
  ratePerSqm: number
  glassAmount: number
  grindingRate?: number
  grindingAmount?: number
  otherCharges?: number
  lineTotal: number
}

export interface GlassItemGroup {
  id: string
  specification: string // e.g. "12 MM CLEAR FLOAT FLAT, TOUGHENED, POLISH(Flat & Arris), HOLE"
  items: GlassItem[]
}

export interface GlassInvoiceData {
  groups: GlassItemGroup[]
  holeChargesCount?: number
  holeChargesRate?: number
  holeChargesAmount?: number
  cutoutChargesCount?: number
  cutoutChargesRate?: number
  cutoutChargesAmount?: number
  adminCharge?: number
  assuranceChargeRate?: number
  assuranceChargeAmount?: number
  assessableValue?: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  invoiceType?: InvoiceType
  customerName: string
  customerAddress: string
  customerState: string
  customerGSTIN: string
  customerPAN: string
  date: Date
  items: InvoiceItem[]
  glassData?: GlassInvoiceData | null
  subtotal: number
  discountType?: "percentage" | "flat" | null
  discountValue?: number | null
  discountAmount?: number | null
  gst: number
  gstBreakdown: GSTBreakdown
  total: number
  status: "paid" | "unpaid" | "overdue"
  createdAt: Date
}

export interface PurchaseBillItem {
  id: string
  name: string
  hsnSac: string
  quantity: number
  rate: number
  unit?: string
  discount?: number
  lineTotal: number
}

export interface PurchaseBill {
  id: string
  billNumber: string
  vendorName: string
  vendorAddress: string
  vendorState: string
  vendorGSTIN: string
  vendorPAN: string
  date: Date
  items: PurchaseBillItem[]
  subtotal: number
  discountType?: "percentage" | "flat"
  discountValue?: number
  discountAmount?: number
  gst: number
  gstBreakdown: GSTBreakdown
  total: number
  status: "paid" | "unpaid" | "overdue"
  createdAt: Date
}

export interface DashboardSummary {
  totalPurchase: number
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  totalInvoices: number
  purchaseChange: number
  revenueChange: number
  paidChange: number
  pendingChange: number
}

export interface User {
  id: string
  email: string
  fullName?: string
  phoneNumber?: string
  panNumber?: string
  address?: string
  state?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  gstNumber?: string
  invoicePrefix?: string
  signature?: string // Base64 encoded signature image
  businessLogo?: string // Base64 encoded logo image
  createdAt: Date
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: SignupData) => Promise<boolean>
  logout: () => void
  updateProfile: (userData: Partial<User>) => void
  isAuthenticated: boolean
}

export interface SignupData {
  email: string
  fullName?: string
  password: string
  phoneNumber?: string
  panNumber?: string
  address?: string
  state?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  gstNumber?: string
  invoicePrefix?: string
}

// Firestore document types (with Timestamps instead of Dates)
export interface FirestoreInvoice extends Omit<Invoice, "date" | "createdAt"> {
  date: any // Firestore Timestamp
  createdAt: any // Firestore Timestamp
}

export interface FirestorePurchaseBill extends Omit<PurchaseBill, "date" | "createdAt"> {
  date: any // Firestore Timestamp
  createdAt: any // Firestore Timestamp
}

export interface FirestoreUser extends Omit<User, "createdAt"> {
  createdAt: any // Firestore Timestamp
}
