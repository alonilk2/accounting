import axios from 'axios';
import type { 
  Customer, 
  Supplier, 
  User, 
  Company, 
  SalesOrder, 
  SalesOrderStatus, 
  CreateSalesOrderForm, 
  Receipt, 
  SalesSummary,
  Item,
  CustomerDocument,
  CustomerDocumentsResponse,
  CustomerDocumentStats,
  Invoice,
  InvoiceStatus,
  CreateInvoiceForm
} from '../types/entities';
import type { 
  CustomerStatement, 
  CustomerStatementRequest,
  CustomerTransaction 
} from '../types/reports';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5121/api',
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; company: Company; token: string }> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  me: async (): Promise<{ user: User; company: Company }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Customers API
export const customersAPI = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get('/customers');
    return response.data.map((customer: Customer) => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    }));
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const response = await api.post('/customers', customer);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  update: async (id: number, customer: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, customer);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Get customer documents
  getDocuments: async (
    customerId: number, 
    companyId?: number,
    fromDate?: Date,
    toDate?: Date,
    documentType?: string
  ): Promise<CustomerDocumentsResponse> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    if (fromDate) params.append('fromDate', fromDate.toISOString());
    if (toDate) params.append('toDate', toDate.toISOString());
    if (documentType) params.append('documentType', documentType);

    const response = await api.get(`/customers/${customerId}/documents?${params.toString()}`);
    return {
      ...response.data,
      fromDate: response.data.fromDate ? new Date(response.data.fromDate) : undefined,
      toDate: response.data.toDate ? new Date(response.data.toDate) : undefined,
      documents: response.data.documents.map((doc: CustomerDocument) => ({
        ...doc,
        documentDate: new Date(doc.documentDate),
      })),
    };
  },

  // Get customer document statistics
  getDocumentStats: async (customerId: number, companyId?: number): Promise<CustomerDocumentStats> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());

    const response = await api.get(`/customers/${customerId}/documents/stats?${params.toString()}`);
    return {
      ...response.data,
      lastOrderDate: response.data.lastOrderDate ? new Date(response.data.lastOrderDate) : undefined,
      firstOrderDate: response.data.firstOrderDate ? new Date(response.data.firstOrderDate) : undefined,
    };
  },
};

// Suppliers API
export const suppliersAPI = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  create: async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> => {
    const response = await api.post('/suppliers', supplier);
    return response.data;
  },

  update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, supplier);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

// Items API
export const itemsAPI = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<Item[]> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const response = await api.get(`/items?${searchParams.toString()}`);
    return response.data.map((item: Item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  },

  getById: async (id: number): Promise<Item> => {
    const response = await api.get(`/items/${id}`);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  create: async (item: Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<Item> => {
    const response = await api.post('/items', item);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  update: async (id: number, item: Partial<Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Item> => {
    const response = await api.put(`/items/${id}`, item);
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/items/${id}`);
  },

  adjustStock: async (id: number, quantityChange: number, reason: string): Promise<Item> => {
    const response = await api.post(`/items/${id}/adjust-stock`, {
      quantityChange,
      reason
    });
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  getBelowReorderPoint: async (): Promise<Item[]> => {
    const response = await api.get('/items/below-reorder-point');
    return response.data.map((item: Item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  },
};

// Sales API
export const salesAPI = {
  getOrders: async (params?: {
    status?: SalesOrderStatus;
    customerId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<SalesOrder[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.customerId) searchParams.append('customerId', params.customerId.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const response = await api.get(`/sales/orders?${searchParams.toString()}`);
    return response.data.map((order: SalesOrder) => ({
      ...order,
      orderDate: new Date(order.orderDate),
      dueDate: order.dueDate ? new Date(order.dueDate) : undefined,
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    }));
  },

  getOrder: async (id: number): Promise<SalesOrder> => {
    const response = await api.get(`/sales/orders/${id}`);
    return {
      ...response.data,
      orderDate: new Date(response.data.orderDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  createOrder: async (order: CreateSalesOrderForm): Promise<SalesOrder> => {
    const response = await api.post('/sales/orders', order);
    return {
      ...response.data,
      orderDate: new Date(response.data.orderDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  updateStatus: async (id: number, status: SalesOrderStatus): Promise<SalesOrder> => {
    const response = await api.put(`/sales/orders/${id}/status`, { status });
    return {
      ...response.data,
      orderDate: new Date(response.data.orderDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  processPayment: async (
    id: number, 
    amount: number, 
    paymentMethod: string,
    notes?: string
  ): Promise<Receipt> => {
    const response = await api.post(`/sales/orders/${id}/payment`, {
      amount,
      paymentMethod,
      notes,
    });
    return {
      ...response.data,
      paymentDate: new Date(response.data.paymentDate),
      createdAt: new Date(response.data.createdAt),
    };
  },

  getOrderReceipts: async (orderId: number): Promise<Receipt[]> => {
    const response = await api.get(`/sales/orders/${orderId}/receipts`);
    return response.data.map((receipt: Receipt) => ({
      ...receipt,
      paymentDate: new Date(receipt.paymentDate),
      createdAt: new Date(receipt.createdAt),
    }));
  },

  getSummary: async (fromDate: Date, toDate: Date): Promise<SalesSummary> => {
    const response = await api.get('/sales/summary', {
      params: {
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
      },
    });
    return {
      ...response.data,
      fromDate: new Date(response.data.fromDate),
      toDate: new Date(response.data.toDate),
    };
  },
};

export interface ReceiptScanResult {
  merchantName?: string;
  date?: string;
  total?: number;
  tax?: number;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

// AI Services API
export const aiAPI = {
  scanReceipt: async (file: File): Promise<ReceiptScanResult> => {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post('/ai/scan-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  query: async (question: string): Promise<{ answer: string; sources?: string[] }> => {
    const response = await api.post('/ai/query', { question });
    return response.data;
  },
};

// Compliance API
export const complianceAPI = {
  exportUnifiedFormat: async (startDate: string, endDate: string): Promise<Blob> => {
    const response = await api.post('/compliance/export', 
      { startDate, endDate },
      { responseType: 'blob' }
    );
    return response.data;
  },
};

// Invoices API
export const invoicesAPI = {
  getAll: async (params?: {
    status?: InvoiceStatus;
    customerId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Invoice[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.customerId) searchParams.append('customerId', params.customerId.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const response = await api.get(`/invoices?${searchParams.toString()}`);
    return response.data.map((invoice: Invoice) => ({
      ...invoice,
      invoiceDate: new Date(invoice.invoiceDate),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
    }));
  },

  getById: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  create: async (invoice: CreateInvoiceForm): Promise<Invoice> => {
    const response = await api.post('/invoices', invoice);
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  updateStatus: async (id: number, status: InvoiceStatus): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}/status`, { status });
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  fromSalesOrder: async (salesOrderId: number): Promise<Invoice> => {
    const response = await api.post(`/invoices/from-sales-order/${salesOrderId}`);
    return {
      ...response.data,
      invoiceDate: new Date(response.data.invoiceDate),
      dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
      createdAt: new Date(response.data.createdAt),
      updatedAt: new Date(response.data.updatedAt),
    };
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  processPayment: async (
    id: number, 
    amount: number, 
    paymentMethod: string,
    notes?: string
  ): Promise<Receipt> => {
    const response = await api.post(`/invoices/${id}/receipts`, {
      amount,
      paymentMethod,
      notes,
    });
    return {
      ...response.data,
      paymentDate: new Date(response.data.paymentDate),
      createdAt: new Date(response.data.createdAt),
    };
  },

  getInvoiceReceipts: async (invoiceId: number): Promise<Receipt[]> => {
    const response = await api.get(`/invoices/${invoiceId}/receipts`);
    return response.data.map((receipt: Receipt) => ({
      ...receipt,
      paymentDate: new Date(receipt.paymentDate),
      createdAt: new Date(receipt.createdAt),
    }));
  },
};

// Reports API
export const reportsAPI = {
  getCustomerStatement: async (request: CustomerStatementRequest): Promise<CustomerStatement> => {
    const response = await api.post('/reports/customer-statement', request);
    return {
      ...response.data,
      fromDate: response.data.fromDate,
      toDate: response.data.toDate,
      transactions: response.data.transactions.map((transaction: CustomerTransaction) => ({
        ...transaction,
        date: transaction.date,
      }))
    };
  },

  getCustomerStatementByParams: async (
    customerId: number,
    fromDate: string,
    toDate: string,
    includeZeroBalanceTransactions: boolean = true
  ): Promise<CustomerStatement> => {
    const response = await api.get(`/reports/customer-statement/${customerId}`, {
      params: {
        fromDate,
        toDate,
        includeZeroBalanceTransactions,
      },
    });
    return {
      ...response.data,
      fromDate: response.data.fromDate,
      toDate: response.data.toDate,
      transactions: response.data.transactions.map((transaction: CustomerTransaction) => ({
        ...transaction,
        date: transaction.date,
      }))
    };
  },
};

export default api;
