import type {
  TaxInvoiceReceipt,
  TaxInvoiceReceiptResponse,
  CreateTaxInvoiceReceipt,
  UpdateTaxInvoiceReceipt,
  TaxInvoiceReceiptFilter
} from '../types/taxInvoiceReceipt';

const API_BASE_URL = '/api/taxinvoicereceipts';

class TaxInvoiceReceiptService {
  // קבלת רשימת חשבוניות מס-קבלה עם סינון
  async getTaxInvoiceReceipts(filter: TaxInvoiceReceiptFilter = {}): Promise<TaxInvoiceReceiptResponse> {
    const params = new URLSearchParams();
    
    if (filter.documentNumber) params.append('documentNumber', filter.documentNumber);
    if (filter.fromDate) params.append('fromDate', filter.fromDate);
    if (filter.toDate) params.append('toDate', filter.toDate);
    if (filter.customerId) params.append('customerId', filter.customerId.toString());
    if (filter.status !== undefined) params.append('status', filter.status.toString());
    if (filter.paymentMethod) params.append('paymentMethod', filter.paymentMethod);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params.append('sortDescending', filter.sortDescending.toString());

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tax invoice receipts: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // קבלת חשבונית מס-קבלה לפי מזהה
  async getTaxInvoiceReceiptById(id: number): Promise<TaxInvoiceReceipt> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('חשבונית מס-קבלה לא נמצאה');
      }
      throw new Error(`Failed to fetch tax invoice receipt: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // יצירת חשבונית מס-קבלה חדשה
  async createTaxInvoiceReceipt(data: CreateTaxInvoiceReceipt): Promise<TaxInvoiceReceipt> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create tax invoice receipt: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // עדכון חשבונית מס-קבלה
  async updateTaxInvoiceReceipt(id: number, data: UpdateTaxInvoiceReceipt): Promise<TaxInvoiceReceipt> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update tax invoice receipt: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // ביטול חשבונית מס-קבלה
  async cancelTaxInvoiceReceipt(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/cancel`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to cancel tax invoice receipt: ${response.statusText}`);
    }
  }

  // מחיקה רכה של חשבונית מס-קבלה
  async deleteTaxInvoiceReceipt(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete tax invoice receipt: ${response.statusText}`);
    }
  }

  // קבלת מספר המסמך הבא
  async getNextDocumentNumber(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/next-document-number`);
    
    if (!response.ok) {
      throw new Error(`Failed to get next document number: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.documentNumber;
  }
}

export const taxInvoiceReceiptService = new TaxInvoiceReceiptService();
export default taxInvoiceReceiptService;
