// Service for Sales Documents - מסמכי מכירות
// מרכז את כל מסמכי המכירות: חשבוניות מס, חשבוניות מס-קבלה, קבלות, תעודות משלוח

import type { 
  SalesDocument, 
  DocumentsFilter, 
  SalesDocumentsResponse, 
  PaginatedSalesDocumentsResponse,
  MonthlyDocuments,
  DocumentType 
} from '../types/salesDocuments';
import type { Receipt } from '../types/entities';
import api from './api';

// Backend DTOs
interface BackendDocumentDto {
  id: number;
  documentType: string;
  documentNumber: string;
  documentDate: string;
  customerName: string;
  customerId: number;
  totalAmount: number;
  status: string;
  currency: string;
  notes?: string;
  canGenerateReceipt: boolean;
  canCancel: boolean;
  canEdit: boolean;
  canEmail: boolean;
  canPrint: boolean;
  canExportPdf: boolean;
}

// Removed unused interface - handled by shared pagination types
/*
interface BackendPaginatedResponse {
  documents: BackendDocumentDto[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
*/

interface BackendMonthlyGroupDto {
  monthKey: string;
  monthDisplay: string;
  documents: BackendDocumentDto[];
  totalCount: number;
  totalAmount: number;
}

// Removed unused interface - handled by shared pagination types
/*
interface BackendSalesDocumentsResponse {
  monthlyGroups: BackendMonthlyGroupDto[];
  totalDocuments: number;
  totalAmount: number;
}
*/

class SalesDocumentsService {
  
  /**
   * Get all sales documents grouped by month
   */
  async getSalesDocuments(filters: DocumentsFilter = {}): Promise<SalesDocumentsResponse> {
    try {
      const params: Record<string, unknown> = {};
      
      if (filters.fromDate) {
        params.fromDate = filters.fromDate.toISOString().split('T')[0];
      }
      if (filters.toDate) {
        params.toDate = filters.toDate.toISOString().split('T')[0];
      }
      if (filters.documentType) {
        params.documentType = filters.documentType;
      }
      if (filters.searchTerm) {
        params.searchTerm = filters.searchTerm;
      }
      if (filters.customerId) {
        params.customerId = filters.customerId;
      }

      const response = await api.get('/salesdocuments', { params });
      
      // Convert backend DTOs to frontend types
      const monthlyGroups: MonthlyDocuments[] = response.data.monthlyGroups.map((group: BackendMonthlyGroupDto) => ({
        month: group.monthKey,
        monthName: group.monthDisplay,
        documents: group.documents.map((doc: BackendDocumentDto) => this.mapBackendDocumentToFrontend(doc)),
        totalCount: group.totalCount,
        totalAmount: group.totalAmount
      }));

      return {
        monthlyGroups,
        totalDocuments: response.data.totalDocuments,
        totalAmount: response.data.totalAmount,
        filters
      };
    } catch (error) {
      console.error('Error fetching sales documents:', error);
      throw error;
    }
  }

  /**
   * Map backend document DTO to frontend SalesDocument
   */
  private mapBackendDocumentToFrontend(doc: BackendDocumentDto): SalesDocument {
    return {
      id: doc.id,
      type: doc.documentType as DocumentType,
      number: doc.documentNumber,
      date: new Date(doc.documentDate),
      customerName: doc.customerName,
      customerId: doc.customerId,
      amount: doc.totalAmount,
      status: doc.status,
      currency: doc.currency,
      notes: doc.notes,
      canGenerateReceipt: doc.canGenerateReceipt,
      canCancel: doc.canCancel,
      canEdit: doc.canEdit,
      canEmail: doc.canEmail,
      canPrint: doc.canPrint,
      canExportPdf: doc.canExportPdf,
      canConvert: false, // Default value for compatibility
      originalDocument: { id: doc.id } as Receipt // Minimal placeholder
    };
  }

  /**
   * Get paginated sales documents for DataGrid
   */
  async getPaginatedSalesDocuments(filters: DocumentsFilter = {}): Promise<PaginatedSalesDocumentsResponse> {
    try {
      const params: Record<string, unknown> = {};
      
      if (filters.fromDate) {
        params.fromDate = filters.fromDate.toISOString().split('T')[0];
      }
      if (filters.toDate) {
        params.toDate = filters.toDate.toISOString().split('T')[0];
      }
      if (filters.documentType) {
        params.documentType = filters.documentType;
      }
      if (filters.searchTerm) {
        params.searchTerm = filters.searchTerm;
      }
      if (filters.customerId) {
        params.customerId = filters.customerId;
      }
      if (filters.page !== undefined) {
        params.page = filters.page;
      }
      if (filters.pageSize !== undefined) {
        params.pageSize = filters.pageSize;
      }

      const response = await api.get('/salesdocuments/paginated', { params });
      
      return {
        documents: response.data.documents.map((doc: BackendDocumentDto) => this.mapBackendDocumentToFrontend(doc)),
        totalCount: response.data.totalCount,
        totalAmount: response.data.totalAmount,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: response.data.totalPages,
        filters
      };
    } catch (error) {
      console.error('Error fetching paginated sales documents:', error);
      throw error;
    }
  }

  /**
   * Cancel a document
   */
  async cancelDocument(document: SalesDocument): Promise<boolean> {
    try {
      await api.post(`/salesdocuments/${document.type}/${document.id}/cancel`);
      return true;
    } catch (error) {
      console.error('Error canceling document:', error);
      throw error;
    }
  }

  /**
   * Generate receipt for an invoice
   */
  async generateReceipt(document: SalesDocument): Promise<Receipt> {
    try {
      if (document.type !== 'Invoice') {
        throw new Error('Can only generate receipts for invoices');
      }

      const response = await api.post(`/salesdocuments/invoice/${document.id}/receipt`, {
        amount: null, // Full amount
        paymentDate: new Date().toISOString(),
        paymentMethod: 'מזומן',
        notes: 'תשלום מלא'
      });

      return response.data;
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Send document by email
   */
  async sendByEmail(document: SalesDocument, email: string): Promise<boolean> {
    try {
      await api.post(`/salesdocuments/${document.type}/${document.id}/send-email`, {
        emailAddress: email
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Print document
   */
  async printDocument(document: SalesDocument): Promise<boolean> {
    try {
      await api.post(`/salesdocuments/${document.type}/${document.id}/print`);
      return true;
    } catch (error) {
      console.error('Error printing document:', error);
      throw error;
    }
  }

  /**
   * Export document to PDF
   */
  async exportToPdf(document: SalesDocument): Promise<Blob> {
    try {
      const response = await api.get(`/salesdocuments/${document.type}/${document.id}/export-pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }
}

export const salesDocumentsService = new SalesDocumentsService();
export default salesDocumentsService;
