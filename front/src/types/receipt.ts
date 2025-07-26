// Receipt related types and interfaces

export interface CreateReceiptRequest {
  invoiceId?: number; // Optional - null for standalone receipts
  paymentDate: string; // YYYY-MM-DD format
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  currency?: string;
  // Fields for standalone receipts (when no invoice)
  customerName?: string;
  customerTaxId?: string;
  description?: string;
}

export interface ReceiptResponse {
  id: number;
  companyId: number;
  invoiceId?: number; // Optional for standalone receipts
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
  
  // Fields for standalone receipts
  customerName?: string;
  customerTaxId?: string;
  description?: string;
  
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
  invoiceNumber?: string; // Optional for standalone receipts
  customerName: string;
  totalAmount?: number; // Optional for standalone receipts
  paidAmount?: number; // Optional for standalone receipts
  remainingAmount?: number; // Optional for standalone receipts
  
  // Fields for standalone receipts
  customerTaxId?: string;
  description?: string;
  isStandalone?: boolean;
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
