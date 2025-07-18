import axios from 'axios';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/entities';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5121',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface CreatePurchaseOrderRequest {
  companyId?: number;
  supplierId: number;
  orderDate: Date;
  dueDate?: Date;
  expectedDeliveryDate?: Date;
  reference?: string;
  notes?: string;
  lines: CreatePurchaseOrderLineRequest[];
}

export interface CreatePurchaseOrderLineRequest {
  itemId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  description?: string;
}

export interface UpdatePurchaseOrderRequest {
  companyId?: number;
  supplierId: number;
  orderDate: Date;
  dueDate?: Date;
  expectedDeliveryDate?: Date;
  reference?: string;
  notes?: string;
  lines: UpdatePurchaseOrderLineRequest[];
}

export interface UpdatePurchaseOrderLineRequest {
  id?: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  description?: string;
}

export interface PurchaseOrderFilters {
  companyId?: number;
  supplierId?: number;
  status?: PurchaseOrderStatus[];
  fromDate?: Date;
  toDate?: Date;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface GoodsReceiptRequest {
  companyId?: number;
  receiptDate: Date;
  reference?: string;
  notes?: string;
  lines: GoodsReceiptLineRequest[];
}

export interface GoodsReceiptLineRequest {
  purchaseOrderLineId: number;
  receivedQuantity: number;
  notes?: string;
}

export interface PaymentRequest {
  companyId?: number;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface PurchaseOrderStats {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  partiallyReceivedOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalValue: number;
  outstandingValue: number;
  lastUpdated: Date;
}

export interface OutstandingOrderSummary {
  supplierId: number;
  supplierName: string;
  orderCount: number;
  totalAmount: number;
  oldestOrderDate: Date;
  currency: string;
}

// Purchase Orders API functions
export const purchaseOrdersAPI = {
  // Get all purchase orders with optional filters
  getAll: async (filters: PurchaseOrderFilters = {}): Promise<PurchaseOrder[]> => {
    const params = new URLSearchParams();
    
    if (filters.companyId) params.append('companyId', filters.companyId.toString());
    if (filters.supplierId) params.append('supplierId', filters.supplierId.toString());
    if (filters.status) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters.fromDate) params.append('fromDate', filters.fromDate.toISOString());
    if (filters.toDate) params.append('toDate', filters.toDate.toISOString());
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const queryString = params.toString();
    const url = `/api/purchaseorders${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<PurchaseOrder[]>(url);
    return response.data;
  },

  // Get purchase order by ID
  getById: async (id: number, companyId?: number): Promise<PurchaseOrder> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/${id}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<PurchaseOrder>(url);
    return response.data;
  },

  // Create new purchase order
  create: async (order: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>('/api/purchaseorders', order);
    return response.data;
  },

  // Update purchase order
  update: async (id: number, order: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await api.put<PurchaseOrder>(`/api/purchaseorders/${id}`, order);
    return response.data;
  },

  // Delete purchase order
  delete: async (id: number, companyId?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/${id}${queryString ? `?${queryString}` : ''}`;
    
    await api.delete(url);
  },

  // Approve purchase order
  approve: async (id: number, companyId?: number): Promise<PurchaseOrder> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/${id}/approve${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.post<PurchaseOrder>(url);
    return response.data;
  },

  // Cancel purchase order
  cancel: async (id: number, reason?: string, companyId?: number): Promise<PurchaseOrder> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    if (reason) params.append('reason', reason);
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/${id}/cancel${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.post<PurchaseOrder>(url);
    return response.data;
  },

  // Record goods receipt
  receiveGoods: async (id: number, receipt: GoodsReceiptRequest): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(`/api/purchaseorders/${id}/receive-goods`, receipt);
    return response.data;
  },

  // Record payment
  recordPayment: async (id: number, payment: PaymentRequest): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(`/api/purchaseorders/${id}/payments`, payment);
    return response.data;
  },

  // Get purchase order statistics
  getStats: async (companyId?: number): Promise<PurchaseOrderStats> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<PurchaseOrderStats>(url);
    return response.data;
  },

  // Get outstanding orders summary
  getOutstandingOrders: async (companyId?: number): Promise<OutstandingOrderSummary[]> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/purchaseorders/outstanding${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<OutstandingOrderSummary[]>(url);
    return response.data;
  },

  // Get pending orders (status = 'Draft')
  getPending: async (companyId?: number): Promise<PurchaseOrder[]> => {
    return purchaseOrdersAPI.getAll({ companyId, status: ['Draft'] });
  },

  // Get confirmed orders (status = 'Confirmed')
  getConfirmed: async (companyId?: number): Promise<PurchaseOrder[]> => {
    return purchaseOrdersAPI.getAll({ companyId, status: ['Confirmed'] });
  },

  // Search purchase orders
  search: async (searchTerm: string, companyId?: number): Promise<PurchaseOrder[]> => {
    return purchaseOrdersAPI.getAll({ companyId, searchTerm });
  },

  // Get orders by supplier
  getBySupplier: async (supplierId: number, companyId?: number): Promise<PurchaseOrder[]> => {
    return purchaseOrdersAPI.getAll({ companyId, supplierId });
  }
};

export default purchaseOrdersAPI;
