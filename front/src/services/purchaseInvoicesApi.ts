import axios from 'axios';
import type { PurchaseInvoice, PurchaseInvoiceStatus, SupplierPayment } from '../types/entities';

// Create API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PurchaseInvoiceFilters {
  status?: PurchaseInvoiceStatus;
  supplierId?: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePurchaseInvoiceDto {
  supplierId: number;
  purchaseOrderId?: number;
  supplierInvoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  receivedDate?: string;
  currency?: string;
  notes?: string;
  description?: string;
  vatRate?: number;
  lines?: CreatePurchaseInvoiceLineDto[];
}

export interface CreatePurchaseInvoiceLineDto {
  itemId?: number;
  description: string;
  quantity: number;
  unit?: string;
  unitCost: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CreateSupplierPaymentDto {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePurchaseInvoiceStatusDto {
  status: PurchaseInvoiceStatus;
}

export const purchaseInvoicesAPI = {
  async getAll(filters?: PurchaseInvoiceFilters): Promise<PurchaseInvoice[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId.toString());
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await api.get(`/api/purchaseinvoices?${params.toString()}`);
    return response.data.map((invoice: Record<string, unknown>) => ({
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate as string),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate as string) : undefined,
      receivedDate: invoice.receivedDate ? new Date(invoice.receivedDate as string) : undefined,
      createdAt: new Date(invoice.createdAt as string),
      updatedAt: new Date(invoice.updatedAt as string)
    })) as PurchaseInvoice[];
  },

  async getById(id: number): Promise<PurchaseInvoice> {
    const response = await api.get(`/api/purchaseinvoices/${id}`);
    const invoice = response.data;
    return {
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      receivedDate: invoice.receivedDate ? new Date(invoice.receivedDate) : undefined,
      payments: invoice.payments?.map((payment: Record<string, unknown>) => ({
        ...payment,
        paymentDate: new Date(payment.paymentDate as string)
      })) || [],
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt)
    };
  },

  async create(data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    const response = await api.post('/api/purchaseinvoices', data);
    const invoice = response.data;
    return {
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      receivedDate: invoice.receivedDate ? new Date(invoice.receivedDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt)
    };
  },

  async updateStatus(id: number, data: UpdatePurchaseInvoiceStatusDto): Promise<void> {
    await api.patch(`/api/purchaseinvoices/${id}/status`, data);
  },

  async addPayment(id: number, data: CreateSupplierPaymentDto): Promise<SupplierPayment> {
    const response = await api.post(`/api/purchaseinvoices/${id}/payments`, data);
    const payment = response.data;
    return {
      ...payment,
      paymentDate: new Date(payment.paymentDate)
    };
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/purchaseinvoices/${id}`);
  }
};
