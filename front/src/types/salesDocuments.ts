// Types for Sales Documents page - מסמכי מכירות
// מרכז את כל מסמכי המכירות: הצעות מחיר, הזמנות, חשבוניות, קבלות, תעודות משלוח

import type { Quote, SalesOrder, DeliveryNote, Invoice, Receipt } from './entities';
import type { TaxInvoiceReceipt } from './taxInvoiceReceipt';

export const DocumentType = {
  Quote: 'Quote',                     // הצעת מחיר
  SalesOrder: 'SalesOrder',           // הזמנה
  DeliveryNote: 'DeliveryNote',       // תעודת משלוח
  Invoice: 'Invoice',                 // חשבונית מס
  TaxInvoiceReceipt: 'TaxInvoiceReceipt', // חשבונית מס-קבלה
  Receipt: 'Receipt'                  // קבלה
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export interface SalesDocument {
  id: number;
  type: DocumentType;
  number: string;
  date: Date;
  customerName: string;
  amount: number;
  status: string;
  currency: string;
  notes?: string;
  customerId: number;
  canGenerateReceipt: boolean;     // האם ניתן להנפיק קבלה
  canCancel: boolean;              // האם ניתן לבטל
  canEdit: boolean;                // האם ניתן לערוך
  canEmail: boolean;               // האם ניתן לשלוח במייל
  canPrint: boolean;               // האם ניתן להדפיס
  canExportPdf: boolean;           // האם ניתן לייצא PDF
  canConvert: boolean;             // האם ניתן להמיר (הצעה להזמנה, הזמנה לחשבונית)
  originalDocument: Quote | SalesOrder | DeliveryNote | Invoice | TaxInvoiceReceipt | Receipt; // המסמך המקורי
}

export interface DocumentsFilter {
  fromDate?: Date;
  toDate?: Date;
  customerId?: number;
  documentType?: DocumentType;
  status?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSalesDocumentsResponse {
  documents: SalesDocument[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: DocumentsFilter;
}

export interface MonthlyDocuments {
  month: string;        // YYYY-MM
  monthName: string;    // שם החודש בעברית
  documents: SalesDocument[];
  totalCount: number;
  totalAmount: number;
}

export interface SalesDocumentsResponse {
  monthlyGroups: MonthlyDocuments[];
  totalDocuments: number;
  totalAmount: number;
  filters: DocumentsFilter;
}

// Labels for document types
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.Quote]: 'הצעת מחיר',
  [DocumentType.SalesOrder]: 'הזמנה',
  [DocumentType.DeliveryNote]: 'תעודת משלוח',
  [DocumentType.Invoice]: 'חשבונית מס',
  [DocumentType.TaxInvoiceReceipt]: 'חשבונית מס-קבלה',
  [DocumentType.Receipt]: 'קבלה'
};

// Status labels for all document types
export const STATUS_LABELS: Record<string, string> = {
  // Quote statuses (both cases for API compatibility)
  'draft': 'טיוטה',
  'Draft': 'טיוטה',
  'QuoteDraft': 'טיוטה',
  'sent': 'נשלחה',
  'Sent': 'נשלחה',
  'accepted': 'התקבלה',
  'Accepted': 'התקבלה',
  'rejected': 'נדחתה',
  'Rejected': 'נדחתה',
  'expired': 'פג תוקף',
  'Expired': 'פג תוקף',
  'converted': 'הומרה להזמנה',
  'Converted': 'הומרה להזמנה',

  // SalesOrder statuses
  'Confirmed': 'מאושרת',
  'PartiallyShipped': 'נשלחה חלקית',
  'Shipped': 'נשלחה',
  'Completed': 'הושלמה',
  'OrderCancelled': 'בוטלה',

  // DeliveryNote statuses
  'DeliveryDraft': 'טיוטה',
  'Prepared': 'מוכנה למשלוח',
  'InTransit': 'בדרך',
  'Delivered': 'נמסרה',
  'Returned': 'הוחזרה',
  'DeliveryCancelled': 'בוטלה',
  
  // Invoice statuses
  'Paid': 'שולמה',
  'Overdue': 'פג תוקף',
  'Cancelled': 'בוטלה',
  
  // TaxInvoiceReceipt statuses (numbers)
  '1': 'שולמה',
  '2': 'בוטלה'
};

// Colors for status chips
export const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  // Quote statuses (both cases for API compatibility)
  'draft': 'default',
  'Draft': 'default',
  'QuoteDraft': 'default',
  'sent': 'info',
  'Sent': 'info',
  'accepted': 'success',
  'Accepted': 'success',
  'rejected': 'error',
  'Rejected': 'error',
  'expired': 'warning',
  'Expired': 'warning',
  'converted': 'primary',
  'Converted': 'primary',

  // SalesOrder statuses
  'Confirmed': 'primary',
  'PartiallyShipped': 'warning',
  'Shipped': 'warning',
  'Completed': 'success',
  'OrderCancelled': 'error',

  // DeliveryNote statuses
  'DeliveryDraft': 'default',
  'Prepared': 'info',
  'InTransit': 'info',
  'Delivered': 'success',
  'Returned': 'error',
  'DeliveryCancelled': 'error',
  'Paid': 'success',
  'Overdue': 'error',
  'Cancelled': 'error',
  '1': 'success',
  '2': 'error'
};

export interface DocumentAction {
  type: 'print' | 'pdf' | 'email' | 'receipt' | 'cancel' | 'edit';
  label: string;
  icon: string;
  enabled: boolean;
  onClick: (document: SalesDocument) => void;
}
