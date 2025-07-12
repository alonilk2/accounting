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
  id: string;
  name: string;
  israelTaxId: string;
  address: string;
  currency: string;
  phone?: string;
  email?: string;
  website?: string;
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
  id: string;
  companyId: string;
  name: string;
  address: string;
  contact: string;
  taxId?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrder {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  agentId?: number;
  agentName?: string;
  orderNumber: string;
  orderDate: Date;
  dueDate?: Date;
  deliveryDate?: Date;
  status: SalesOrderStatus;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
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

export type SalesOrderStatus = 'Quote' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled';

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

export interface PurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string;
  date: Date;
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'paid' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderLine {
  id: string;
  purchaseId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  description?: string;
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
  address: string;
  contact: string;
  taxId?: string;
  email?: string;
  phone?: string;
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
