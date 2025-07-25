import api from './api';
import type { 
  DocumentScanRequest, 
  DocumentScanResponse, 
  CreateExpenseFromScanRequest 
} from '../types/documentScan';

const API_BASE = '/aiassistant';

export const documentScanApi = {
  /**
   * Scan a document (invoice, receipt, etc.) and extract expense data
   */
  async scanDocument(request: DocumentScanRequest): Promise<DocumentScanResponse> {
    const response = await api.post(`${API_BASE}/scan-document`, request, {
      timeout: 60000 // 60 seconds for document scanning
    });
    return response.data;
  },

  /**
   * Create an expense from scanned and reviewed document data
   */
  async createExpenseFromScan(request: CreateExpenseFromScanRequest): Promise<{ expenseId: number; message: string; success: boolean }> {
    const response = await api.post(`${API_BASE}/create-expense-from-scan`, request, {
      timeout: 30000 // 30 seconds for expense creation
    });
    return response.data;
  },

  /**
   * Store document file and return URL
   */
  async storeDocument(request: DocumentScanRequest): Promise<{ documentUrl: string; message: string; success: boolean }> {
    const response = await api.post(`${API_BASE}/store-document`, request, {
      timeout: 30000 // 30 seconds for document storage
    });
    return response.data;
  }
};

/**
 * Utility function to convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Validate file type for document scanning
 */
export const isValidDocumentFile = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  return validTypes.includes(file.type);
};

/**
 * Get maximum file size for document scanning (10MB)
 */
export const getMaxFileSize = (): number => {
  return 10 * 1024 * 1024; // 10MB in bytes
};

/**
 * Validate file size
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= getMaxFileSize();
};

/**
 * Get human readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
