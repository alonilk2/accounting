// API service for Quotes - שירות API להצעות מחיר
import type { AxiosResponse } from 'axios';
import api from './api';
import type { Quote, QuoteStatus } from '../types/entities';
import type { PaginatedResponse } from '../types/pagination';

// DTOs for Quote operations
export interface CreateQuoteRequest {
  customerId: number;
  agentId?: number;
  quoteDate?: string; // ISO date string
  validUntil?: string; // ISO date string
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  currency?: string;
  notes?: string;
  terms?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  lines: CreateQuoteLineRequest[];
}

export interface CreateQuoteLineRequest {
  itemId: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate: number;
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
}

export interface QuoteResponse {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  agentId?: number;
  agentName?: string;
  quoteNumber: string;
  quoteDate: string;
  validUntil?: string;
  status: string; // Will be normalized in mapper
  paymentTerms?: string;
  notes?: string;
  terms?: string;
  deliveryTerms?: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  convertedToSalesOrderId?: number;
  convertedAt?: string;
  lines: QuoteLineResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteLineResponse {
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

export interface QuoteFilters {
  customerId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface QuotesListResponse {
  quotes: QuoteResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Helper function to convert QuoteResponse to Quote entity
const mapQuoteResponseToEntity = (response: QuoteResponse): Quote => {
  // Normalize status to match TypeScript enum (capitalize first letter)
  const normalizeStatus = (status: string): QuoteStatus => {
    const statusMap: Record<string, QuoteStatus> = {
      'draft': 'Draft',
      'sent': 'Sent',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'expired': 'Expired',
      'converted': 'Converted'
    };
    return statusMap[status.toLowerCase()] || status as QuoteStatus;
  };

  return {
    id: response.id,
    companyId: response.companyId,
    customerId: response.customerId,
    customerName: response.customerName,
    agentId: response.agentId,
    agentName: response.agentName,
    quoteNumber: response.quoteNumber,
    quoteDate: new Date(response.quoteDate),
    validUntil: response.validUntil ? new Date(response.validUntil) : null,
    status: normalizeStatus(response.status as string),
    subtotalAmount: response.subtotalAmount,
    discountAmount: response.discountAmount,
    taxAmount: response.taxAmount,
    totalAmount: response.totalAmount,
    currency: response.currency,
    exchangeRate: response.exchangeRate,
    notes: response.notes || undefined,
    terms: response.terms || undefined,
    deliveryTerms: response.deliveryTerms || undefined,
    paymentTerms: response.paymentTerms || undefined,
    convertedToSalesOrderId: response.convertedToSalesOrderId,
    convertedAt: response.convertedAt ? new Date(response.convertedAt) : undefined,
    lines: response.lines.map(line => ({
      id: line.id,
      quoteId: line.quoteId,
      itemId: line.itemId,
      itemName: line.itemName,
      itemSku: line.itemSku,
      lineNumber: line.lineNumber,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      taxRate: line.taxRate,
      lineTotal: line.lineTotal,
      taxAmount: line.taxAmount,
      lineTotalWithTax: line.lineTotalWithTax
    })),
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt)
  };
};

export class QuotesApi {
  private baseUrl = '/quotes';

  /**
   * Get all quotes with optional filtering
   */
  async getQuotes(
    companyId: number,
    filters?: QuoteFilters,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Quote[]> {
    try {
      const params = new URLSearchParams({
        companyId: companyId.toString(),
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      if (filters) {
        if (filters.customerId) params.append('customerId', filters.customerId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      }

      const response: AxiosResponse<PaginatedResponse<QuoteResponse>> = await api.get(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data.map(mapQuoteResponseToEntity);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      
      // Enhanced error handling with more specific messages
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
          throw new Error('לא ניתן להתחבר לשרת. אנא בדוק שהשרת רץ.');
        }
        if (error.message.includes('401')) {
          throw new Error('שגיאת הרשאה. אנא התחבר מחדש.');
        }
        if (error.message.includes('403')) {
          throw new Error('אין לך הרשאה לצפות בהצעות מחיר.');
        }
        if (error.message.includes('404')) {
          throw new Error('שירות הצעות המחיר לא נמצא.');
        }
        if (error.message.includes('500')) {
          throw new Error('שגיאת שרת פנימית. אנא נסה שוב מאוחר יותר.');
        }
      }
      
      throw new Error('שגיאה בטעינת הצעות המחיר');
    }
  }

  /**
   * Get a specific quote by ID
   */
  async getQuote(id: number, companyId: number): Promise<Quote> {
    try {
      const response: AxiosResponse<QuoteResponse> = await api.get(
        `${this.baseUrl}/${id}?companyId=${companyId}`
      );

      return mapQuoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error('שגיאה בטעינת הצעת המחיר');
    }
  }

  /**
   * Create a new quote
   */
  async createQuote(request: CreateQuoteRequest, companyId: number): Promise<Quote> {
    try {
      const response: AxiosResponse<QuoteResponse> = await api.post(
        `${this.baseUrl}?companyId=${companyId}`,
        request
      );

      return mapQuoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error('שגיאה ביצירת הצעת המחיר');
    }
  }

  /**
   * Update an existing quote
   */
  async updateQuote(id: number, quote: Partial<Quote>, companyId: number): Promise<Quote> {
    try {
      const request: UpdateQuoteRequest = {};

      if (quote.customerId !== undefined) request.customerId = quote.customerId;
      if (quote.agentId !== undefined) request.agentId = quote.agentId;
      if (quote.quoteDate !== undefined) request.quoteDate = quote.quoteDate.toISOString();
      if (quote.validUntil !== undefined) request.validUntil = quote.validUntil?.toISOString();
      if (quote.status !== undefined) request.status = quote.status;
      if (quote.currency !== undefined) request.currency = quote.currency;
      if (quote.notes !== undefined) request.notes = quote.notes;
      if (quote.terms !== undefined) request.terms = quote.terms;
      if (quote.deliveryTerms !== undefined) request.deliveryTerms = quote.deliveryTerms;
      if (quote.paymentTerms !== undefined) request.paymentTerms = quote.paymentTerms;
      if (quote.lines !== undefined) {
        request.lines = quote.lines.map(line => ({
          itemId: line.itemId,
          description: line.description || '',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxRate: line.taxRate
        }));
      }

      const response: AxiosResponse<QuoteResponse> = await api.put(
        `${this.baseUrl}/${id}?companyId=${companyId}`,
        request
      );

      return mapQuoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw new Error('שגיאה בעדכון הצעת המחיר');
    }
  }

  /**
   * Delete a quote (soft delete)
   */
  async deleteQuote(id: number, companyId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}?companyId=${companyId}`);
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw new Error('שגיאה במחיקת הצעת המחיר');
    }
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(
    id: number, 
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted',
    companyId: number
  ): Promise<Quote> {
    try {
      const response: AxiosResponse<QuoteResponse> = await api.patch(
        `${this.baseUrl}/${id}/status`,
        { status, companyId }
      );

      return mapQuoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw new Error('שגיאה בעדכון סטטוס הצעת המחיר');
    }
  }

  /**
   * Convert quote to sales order
   */
  async convertToSalesOrder(id: number, companyId: number): Promise<{ quoteId: number; salesOrderId: number }> {
    try {
      const response: AxiosResponse<{ quoteId: number; salesOrderId: number }> = await api.post(
        `${this.baseUrl}/${id}/convert-to-order`,
        { companyId }
      );

      return response.data;
    } catch (error) {
      console.error('Error converting quote to sales order:', error);
      throw new Error('שגיאה בהמרת הצעת המחיר להזמנה');
    }
  }

  /**
   * Duplicate a quote
   */
  async duplicateQuote(id: number, companyId: number): Promise<Quote> {
    try {
      const response: AxiosResponse<QuoteResponse> = await api.post(
        `${this.baseUrl}/${id}/duplicate`,
        { companyId }
      );

      return mapQuoteResponseToEntity(response.data);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      throw new Error('שגיאה בשכפול הצעת המחיר');
    }
  }

  /**
   * Generate PDF for a quote
   */
  async generatePdf(id: number, companyId: number): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        `${this.baseUrl}/${id}/pdf?companyId=${companyId}`,
        { responseType: 'blob' }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('שגיאה ביצירת PDF');
    }
  }

  /**
   * Send quote by email
   */
  async sendByEmail(
    id: number, 
    companyId: number, 
    emailTo: string, 
    subject?: string, 
    body?: string
  ): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${id}/send-email`, {
        companyId,
        emailTo,
        subject,
        body
      });
    } catch (error) {
      console.error('Error sending quote by email:', error);
      throw new Error('שגיאה בשליחת הצעת המחיר במייל');
    }
  }
}

// Export singleton instance
export const quotesApi = new QuotesApi();
