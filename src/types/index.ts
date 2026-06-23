export type InvoiceStatus =
  | "draft"
  | "sent"
  | "part_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type SaleStatus =
  | "paid"
  | "part_paid"
  | "unpaid"
  | "refunded"
  | "cancelled";

export type OrderStatus =
  | "pending"
  | "measurement_taken"
  | "fabric_received"
  | "cutting"
  | "sewing"
  | "fitting"
  | "ready"
  | "delivered"
  | "cancelled";

export type SaleSource = "invoice" | "direct";
export type PaymentMethod = "cash" | "transfer" | "pos" | "card" | "other";
export type SpecialDateType = "birthday" | "anniversary" | "special";
export type UserRole = "admin" | "staff";

export type StaffProfile = {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type Page =
  | "search"
  | "dashboard"
  | "invoices"
  | "create-invoice"
  | "invoice-details"
  | "sales"
  | "add-sale"
  | "sale-details"
  | "customers"
  | "customer-details"
  | "orders"
  | "products"
  | "receipts"
  | "receipt-details"
  | "reports"
  | "settings"
  | "backup"
  | "manage-staff";

export type BusinessSettings = {
  id: string;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  invoicePrefix: string;
  salePrefix: string;
  orderPrefix: string;
  receiptPrefix: string;
  defaultTaxRate: number;
  defaultTerms: string;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  weddingAnniversary: string;
  spouseName: string;
  preferredStyle: string;
  preferredColor: string;
  preferredFabric: string;
  fitNotes: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSpecialDate = {
  id: string;
  customerId: string;
  title: string;
  date: string;
  type: SpecialDateType;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CelebrationReminder = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  type: SpecialDateType;
  date: string;
  nextDate: Date;
  daysUntil: number;
  notes: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultPrice: number;
  taxable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Measurement = {
  id: string;
  customerId: string;
  title: string;
  dateTaken: string;
  chest: string;
  waist: string;
  hip: string;
  shoulder: string;
  sleeve: string;
  neck: string;
  roundSleeve: string;
  topLength: string;
  trouserWaist: string;
  trouserLength: string;
  thigh: string;
  knee: string;
  ankle: string;
  agbadaLength: string;
  capSize: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  outfitType: string;
  orderDate: string;
  dueDate: string;
  status: OrderStatus;
  totalAmount: number;
  depositPaid: number;
  balanceDue: number;
  linkedInvoiceId?: string;
  linkedSaleId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderReminder = {
  id: string;
  customerId: string;
  customerName: string;
  orderNumber: string;
  outfitType: string;
  dueDate: string;
  status: OrderStatus;
  daysUntil: number;
};

export type Receipt = {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  description: string;
  linkedInvoiceId?: string;
  linkedSaleId?: string;
  linkedOrderId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
};

export type SaleItem = {
  id: string;
  saleId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
};

export type Payment = {
  id: string;
  invoiceId?: string;
  saleId?: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryFee: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes: string;
  terms: string;
  linkedSaleId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  saleNumber: string;
  invoiceId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  saleDate: string;
  source: SaleSource;
  status: SaleStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryFee: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type DraftItem = {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

export type InvoiceFormState = {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  deliveryFee: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  notes: string;
  terms: string;
  items: DraftItem[];
};

export type SaleFormState = {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  saleDate: string;
  status: SaleStatus;
  currency: string;
  deliveryFee: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  note: string;
  items: DraftItem[];
};


