// Receipt related types and interfaces

export interface CreateReceiptRequest {
  invoiceId: number;
  paymentDate: string; // YYYY-MM-DD format
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  currency?: string;
}

export interface ReceiptResponse {
  id: number;
  companyId: number;
  invoiceId: number;
  receiptNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  currency: string;
  exchangeRate: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data
  invoice?: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    customerName: string;
  };
}

export interface ReceiptListItem {
  id: number;
  receiptNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  currency: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export const PAYMENT_METHODS = [
  'מזומן',
  'כרטיס אשראי',
  'העברה בנקאית',
  'צ\'ק',
  'ביט',
  'פייפאל',
  'אחר'
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
