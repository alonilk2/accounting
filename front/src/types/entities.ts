// Core entity types based on the database schema

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: 'BusinessOwner' | 'Accountant' | 'Bookkeeper' | 'AI_Assistant';
  description: string;
  permissions: string[];
}

export interface Company {
  id: number;
  name: string;
  israelTaxId: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  fiscalYearStartMonth: number;
  timeZone: string;
  isActive: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChartOfAccount {
  id: string;
  companyId: string;
  accountNumber: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parentAccountId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: number;
  companyId: number;
  name: string;
  address: string;
  contact: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  paymentTerms?: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: number;
  companyId: number;
  name: string;
  address?: string;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  vatNumber?: string;
  paymentTermsDays: number;
  isActive: boolean;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  commissionRate: number;
  contactInfo: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: number;
  companyId: number;
  sku: string;
  name: string;
  nameHebrew?: string;
  description?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStockQty: number;
  reorderPoint: number;
  maxStockLevel: number;
  itemType: string;
  isInventoryTracked: boolean;
  isActive: boolean;
  isSellable: boolean;
  isPurchasable: boolean;
  weight?: number;
  volume?: number;
  barcode?: string;
  imageUrl?: string;
  preferredSupplierId?: number;
  // Backward compatibility aliases
  cost: number;
  price: number;
  purchasePrice?: number; // Added for purchasing operations
  createdAt: Date;
  updatedAt: Date;
}

// Quote entities - separate from SalesOrder
export interface Quote {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  agentId?: number;
  agentName?: string;
  quoteNumber: string;
  quoteDate: Date;
  validUntil?: Date | null;
  status: QuoteStatus;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  notes?: string;
  terms?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  convertedToSalesOrderId?: number;
  convertedAt?: Date;
  lines: QuoteLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteLine {
  id: number;
  quoteId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  lineNumber: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  lineTotal: number;
  taxAmount: number;
  lineTotalWithTax: number;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';

// Sales Order entities - now separate from quotes
export interface SalesOrder {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  agentId?: number;
  agentName?: string;
  orderNumber: string;
  orderDate: Date;
  requiredDate?: Date;
  promisedDate?: Date;
  status: SalesOrderStatus;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  shippingMethod?: string;
  quoteId?: number; // Reference to original quote if converted
  dueDate?: Date;
  deliveryDate?: Date;
  lines: SalesOrderLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderLine {
  id: number;
  salesOrderId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  lineNumber: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export type SalesOrderStatus = 'Draft' | 'Quote' | 'Confirmed' | 'PartiallyShipped' | 'Shipped' | 'Completed' | 'Cancelled';

// Delivery Note entities
export interface DeliveryNote {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  deliveryNoteNumber: string;
  deliveryDate: Date;
  expectedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  status: DeliveryNoteStatus;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  driverName?: string;
  vehiclePlate?: string;
  totalQuantity: number;
  totalWeight?: number;
  totalVolume?: number;
  deliveryInstructions?: string;
  notes?: string;
  customerSignature?: string;
  receivedByName?: string;
  receivedAt?: Date;
  trackingNumber?: string;
  courierService?: string;
  lines: DeliveryNoteLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryNoteLine {
  id: number;
  deliveryNoteId: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  salesOrderLineId?: number;
  lineNumber: number;
  description?: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityReturned: number;
  unit?: string;
  unitWeight?: number;
  unitVolume?: number;
  serialNumbers?: string;
  batchNumbers?: string;
  expiryDate?: Date;
  itemCondition?: string;
  notes?: string;
}

export type DeliveryNoteStatus = 'Draft' | 'Prepared' | 'InTransit' | 'Delivered' | 'Returned' | 'Cancelled';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: number;
  companyId: number;
  customerId: number;
  salesOrderId?: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  status: InvoiceStatus;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  customerName: string;
  customerAddress: string;
  customerTaxId?: string;
  customerContact?: string;
  lines: InvoiceLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  itemId?: number;
  lineNumber: number;
  description: string;
  itemSku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Receipt {
  id: number;
  invoiceId: number;
  receiptNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
}

export interface SalesSummary {
  fromDate: Date;
  toDate: Date;
  totalSales: number;
  totalTax: number;
  netSales: number;
  orderCount: number;
  averageOrderValue: number;
  uniqueCustomers: number;
}

export type PurchaseOrderStatus = 
  | 'Draft' 
  | 'Confirmed' 
  | 'Received' 
  | 'Invoiced' 
  | 'Paid' 
  | 'Cancelled';

export type PurchaseInvoiceStatus = 'Draft' | 'Received' | 'Approved' | 'Paid' | 'Cancelled';

export interface PurchaseOrder {
  id: number;
  companyId: number;
  supplierId: number;
  supplierName?: string;
  orderNumber: string;
  supplierInvoiceNumber?: string;
  orderDate: Date;
  dueDate?: Date;
  deliveryDate?: Date;
  status: PurchaseOrderStatus;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  exchangeRate: number;
  notes?: string;
  deliveryAddress?: string;
  lines: PurchaseOrderLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderLine {
  id: number;
  purchaseOrderId: number;
  itemId: number;
  itemName?: string;
  itemSku?: string;
  lineNumber: number;
  description?: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  receivedQuantity: number;
}

export interface PurchaseInvoice {
  id: number;
  companyId: number;
  supplierId: number;
  supplierName: string;
  purchaseOrderId?: number;
  supplierInvoiceNumber: string;
  internalReferenceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  receivedDate?: Date;
  status: PurchaseInvoiceStatus;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  notes?: string;
  description?: string;
  vatRate: number;
  isFullyPaid: boolean;
  isOverdue: boolean;
  lines?: PurchaseInvoiceLine[];
  payments?: SupplierPayment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseInvoiceLine {
  id: number;
  purchaseInvoiceId: number;
  itemId?: number;
  itemName?: string;
  itemSKU?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
  subtotalAmount: number;
  taxAmount: number;
}

export interface SupplierPayment {
  id: number;
  purchaseInvoiceId: number;
  supplierId: number;
  paymentNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface StandingOrder {
  id: string;
  companyId: string;
  customerId: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextDate: Date;
  amount: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Common API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Form data types
export interface CreateCustomerForm {
  name: string;
  address: string;
  contact: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

// Customer Documents Types
export interface CustomerDocument {
  id: number;
  documentType: 'SalesOrder' | 'Receipt' | 'POSSale';
  documentNumber: string;
  documentDate: Date;
  totalAmount: number;
  status: string;
  description?: string;
}

export interface CustomerDocumentsResponse {
  customerId: number;
  customerName: string;
  documents: CustomerDocument[];
  totalDocuments: number;
  totalAmount: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface CustomerDocumentStats {
  customerId: number;
  customerName: string;
  totalSalesOrders: number;
  totalInvoices: number;
  totalReceipts: number;
  totalPOSSales: number;
  totalSalesAmount: number;
  totalInvoiceAmount: number;
  totalReceiptsAmount: number;
  outstandingAmount: number;
  lastDocumentDate?: Date;
  firstDocumentDate?: Date;
}

export interface CreateSupplierForm {
  name: string;
  address?: string;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  vatNumber?: string;
  paymentTermsDays: number;
  isActive: boolean;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  notes?: string;
}

export interface CreateItemForm {
  sku: string;
  name: string;
  unit: string;
  cost: number;
  price: number;
  reorderPoint: number;
  description?: string;
}

export interface CreateInvoiceForm {
  customerId: number;
  salesOrderId?: number;
  invoiceDate: Date;
  dueDate?: Date;
  currency: string;
  notes?: string;
  lines: CreateInvoiceLineForm[];
}

export interface CreateInvoiceLineForm {
  itemId?: number;
  description: string;
  itemSku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
}

export interface CreateSalesOrderForm {
  customerId: number;
  agentId?: number;
  orderDate?: Date;
  dueDate?: Date;
  deliveryDate?: Date;
  status?: SalesOrderStatus;
  currency?: string;
  notes?: string;
  lines: CreateSalesOrderLineForm[];
}

export interface CreateSalesOrderLineForm {
  itemId: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

// Re-export AI types for convenience
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatContext,
  SuggestedAction,
  ChatSession,
  AIAssistantState,
} from './ai';
