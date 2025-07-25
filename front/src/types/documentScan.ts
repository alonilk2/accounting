// Document scanning types for frontend

export interface DocumentScanRequest {
  fileData: string; // Base64 encoded file data
  fileName: string;
  contentType: string;
  documentType: DocumentType;
  supplierId?: number;
}

export interface DocumentScanResponse {
  isSuccess: boolean;
  errorMessage?: string;
  confidenceScore: number;
  processingTimeMs: number;
  extractedData?: ScannedExpenseData;
  documentUrl?: string;
  reviewRequired?: string[];
}

export interface ScannedExpenseData {
  supplier?: SupplierInfo;
  documentDate?: string;
  documentNumber?: string;
  totalAmount?: number;
  netAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  currency?: string;
  suggestedCategory?: number;
  description?: string;
  descriptionHebrew?: string;
  paymentMethod?: string;
  status?: number; // ExpenseStatus enum value
  lineItems?: ScannedLineItem[];
}

export interface SupplierInfo {
  supplierId?: number;
  name?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  isNewSupplier: boolean;
}

export interface ScannedLineItem {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  vatRate?: number;
}

export const DocumentType = {
  Invoice: 1,
  Receipt: 2,
  Bill: 3,
  CreditNote: 4
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export interface CreateExpenseFromScanRequest {
  expenseData: ScannedExpenseData;
  documentUrl?: string;
  reviewNotes?: string;
  createNewSupplier?: boolean;
}

export interface DocumentUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'scanning' | 'completed' | 'error';
  error?: string;
}
