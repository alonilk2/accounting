// Types for Sales Documents page - מסמכי מכירות
// מרכז את כל מסמכי המכירות: חשבוניות מס, חשבוניות מס-קבלה, קבלות, תעודות משלוח

import type { SalesOrder, Invoice, Receipt } from './entities';
import type { TaxInvoiceReceipt } from './taxInvoiceReceipt';

export const DocumentType = {
  SalesOrder: 'SalesOrder',           // הזמנת מכירה/הצעת מחיר
  Invoice: 'Invoice',                 // חשבונית מס
  TaxInvoiceReceipt: 'TaxInvoiceReceipt', // חשבונית מס-קבלה
  Receipt: 'Receipt',                 // קבלה
  DeliveryNote: 'DeliveryNote'        // תעודת משלוח
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
  originalDocument: SalesOrder | Invoice | TaxInvoiceReceipt | Receipt; // המסמך המקורי
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
  [DocumentType.SalesOrder]: 'הזמנת מכירה',
  [DocumentType.Invoice]: 'חשבונית מס',
  [DocumentType.TaxInvoiceReceipt]: 'חשבונית מס-קבלה',
  [DocumentType.Receipt]: 'קבלה',
  [DocumentType.DeliveryNote]: 'תעודת משלוח'
};

// Status labels for all document types
export const STATUS_LABELS: Record<string, string> = {
  // SalesOrder statuses
  'Quote': 'הצעת מחיר',
  'Confirmed': 'מאושרת',
  'Shipped': 'נשלחה',
  'Completed': 'הושלמה',
  'Cancelled': 'בוטלה',
  
  // Invoice statuses
  'Draft': 'טיוטה',
  'Sent': 'נשלחה',
  'Paid': 'שולמה',
  'Overdue': 'פג תוקף',
  
  // TaxInvoiceReceipt statuses (numbers)
  '1': 'שולמה',
  '2': 'בוטלה'
};

// Colors for status chips
export const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'Quote': 'info',
  'Confirmed': 'primary',
  'Shipped': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
  'Draft': 'default',
  'Sent': 'info',
  'Paid': 'success',
  'Overdue': 'error',
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
