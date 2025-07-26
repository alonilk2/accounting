import api from './api';

export interface DocumentUrlsResponse {
  viewUrl: string;
  downloadUrl: string;
}

interface DownloadParams {
  companyId?: number;
  fromDate?: string;
  toDate?: string;
  documentType?: string;
}

class PrintService {
  /**
   * Get URLs for viewing and downloading a document
   */
  async getDocumentUrls(
    documentType: string,
    documentId: number,
    companyId?: number
  ): Promise<DocumentUrlsResponse> {
    const params = companyId ? { companyId } : {};
    
    const response = await api.get<DocumentUrlsResponse>(
      `/print/urls/${documentType}/${documentId}`,
      { params }
    );
    
    return response.data;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoicePdf(
    invoiceId: number,
    companyId?: number
  ): Promise<Blob> {
    const params = companyId ? { companyId } : {};
    
    const response = await api.get(
      `/print/invoice/${invoiceId}`,
      {
        params,
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    );
    
    return response.data;
  }

  /**
   * Download receipt PDF
   */
  async downloadReceiptPdf(
    receiptId: number,
    companyId?: number
  ): Promise<Blob> {
    const params = companyId ? { companyId } : {};
    
    const response = await api.get(
      `/print/receipt/${receiptId}`,
      {
        params,
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    );
    
    return response.data;
  }

  /**
   * Download customer documents report PDF
   */
  async downloadCustomerDocumentsReport(
    customerId: number,
    companyId?: number,
    fromDate?: Date,
    toDate?: Date,
    documentType?: string
  ): Promise<Blob> {
    const params: DownloadParams = {};
    
    if (companyId) params.companyId = companyId;
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();
    if (documentType) params.documentType = documentType;
    
    const response = await api.get(
      `/print/customer-documents/${customerId}`,
      {
        params,
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      }
    );
    
    return response.data;
  }

  /**
   * Open document view in a new window/tab
   */
  async viewDocument(
    documentType: string,
    documentId: number,
    companyId?: number
  ): Promise<void> {
    const urls = await this.getDocumentUrls(documentType, documentId, companyId);
    window.open(urls.viewUrl, '_blank');
  }

  /**
   * Download document and trigger file download
   */
  async downloadDocument(
    documentType: string,
    documentId: number,
    companyId?: number
  ): Promise<void> {
    let blob: Blob;
    let filename: string;

    switch (documentType.toLowerCase()) {
      case 'salesorder':
        blob = await this.downloadInvoicePdf(documentId, companyId);
        filename = `salesorder-${documentId}.pdf`;
        break;
      case 'invoice':
        blob = await this.downloadInvoicePdf(documentId, companyId);
        filename = `invoice-${documentId}.pdf`;
        break;
      case 'receipt':
        blob = await this.downloadReceiptPdf(documentId, companyId);
        filename = `receipt-${documentId}.pdf`;
        break;
      case 'possale':
        blob = await this.downloadReceiptPdf(documentId, companyId);
        filename = `pos-sale-${documentId}.pdf`;
        break;
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }

    this.triggerDownload(blob, filename);
  }

  /**
   * Download customer documents report
   */
  async downloadCustomerReport(
    customerId: number,
    customerName: string,
    companyId?: number,
    fromDate?: Date,
    toDate?: Date,
    documentType?: string
  ): Promise<void> {
    const blob = await this.downloadCustomerDocumentsReport(
      customerId,
      companyId,
      fromDate,
      toDate,
      documentType
    );
    
    const filename = `customer-documents-${customerName}-${customerId}.pdf`;
    this.triggerDownload(blob, filename);
  }

  /**
   * Trigger file download using browser API
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
  }
}

export const printService = new PrintService();
