// Tax Invoice Receipt types - חשבונית מס-קבלה
// מסמך שמשלב יחד חשבונית מס וקבלה, מתאים לעסקים שמקבלים תשלום מיידי

export const TaxInvoiceReceiptStatus = {
  Paid: 1,      // שולם
  Cancelled: 2  // בוטל
} as const;

export type TaxInvoiceReceiptStatus = typeof TaxInvoiceReceiptStatus[keyof typeof TaxInvoiceReceiptStatus];

export interface TaxInvoiceReceiptLine {
  id: number;
  itemId: number;
  itemName: string;
  itemSku: string;
  itemUnit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  lineSubTotal: number;
  lineVatAmount: number;
  lineTotalAmount: number;
}

export interface TaxInvoiceReceipt {
  id: number;
  customerId: number;
  customerName: string;
  documentNumber: string;
  documentDate: string;
  status: TaxInvoiceReceiptStatus;
  statusDisplayName: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  referenceNumber?: string;
  currency: string;
  exchangeRate?: number;
  notes?: string;
  createdAt: string;
  lines: TaxInvoiceReceiptLine[];
}

export interface TaxInvoiceReceiptListItem {
  id: number;
  documentNumber: string;
  documentDate: string;
  customerName: string;
  status: TaxInvoiceReceiptStatus;
  statusDisplayName: string;
  totalAmount: number;
  paymentMethod: string;
  currency: string;
}

export interface CreateTaxInvoiceReceiptLine {
  itemId: number;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  vatRate?: number;
}

export interface CreateTaxInvoiceReceipt {
  customerId: number;
  documentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  lines: CreateTaxInvoiceReceiptLine[];
}

export interface UpdateTaxInvoiceReceipt {
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface TaxInvoiceReceiptFilter {
  documentNumber?: string;
  fromDate?: string;
  toDate?: string;
  customerId?: number;
  status?: TaxInvoiceReceiptStatus;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface TaxInvoiceReceiptResponse {
  items: TaxInvoiceReceiptListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const TAX_INVOICE_RECEIPT_STATUS_LABELS: Record<TaxInvoiceReceiptStatus, string> = {
  [TaxInvoiceReceiptStatus.Paid]: 'שולם',
  [TaxInvoiceReceiptStatus.Cancelled]: 'בוטל'
};

export const PAYMENT_METHODS = [
  'מזומן',
  'כרטיס אשראי',
  'העברה בנקאית',
  'צ\'ק',
  'דיגיטלי'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
