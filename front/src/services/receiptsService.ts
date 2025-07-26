import api from './api';
import type { 
  CreateReceiptRequest, 
  ReceiptResponse, 
  ReceiptListItem 
} from '../types/receipt';
import type { PaginatedResponse } from '../types/pagination';

export class ReceiptsService {
  private readonly baseUrl = '/receipts';

  async createReceipt(data: CreateReceiptRequest): Promise<ReceiptResponse> {
    const response = await api.post<ReceiptResponse>(`${this.baseUrl}`, data);
    return response.data;
  }

  async getReceipts(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    invoiceId?: number;
    customerId?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedResponse<ReceiptListItem>> {
    const response = await api.get<PaginatedResponse<ReceiptListItem>>(`${this.baseUrl}`, {
      params
    });
    return response.data;
  }

  async getReceiptById(id: number, companyId?: number): Promise<ReceiptResponse> {
    const params: Record<string, unknown> = {};
    if (companyId) params.companyId = companyId;
    
    const response = await api.get<ReceiptResponse>(`${this.baseUrl}/${id}`, { params });
    return response.data;
  }

  async updateReceipt(id: number, data: Partial<CreateReceiptRequest>): Promise<ReceiptResponse> {
    const response = await api.put<ReceiptResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteReceipt(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getReceiptsByInvoice(invoiceId: number): Promise<ReceiptListItem[]> {
    const response = await api.get<ReceiptListItem[]>(`${this.baseUrl}/by-invoice/${invoiceId}`);
    return response.data;
  }

  async printReceipt(id: number): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${id}/print`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const receiptsService = new ReceiptsService();
export default receiptsService;
