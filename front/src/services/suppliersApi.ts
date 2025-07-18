import axios from 'axios';
import type { Supplier, CreateSupplierForm } from '../types/entities';

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

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalPurchaseOrders: number;
  outstandingPayables: number;
  lastUpdated: Date;
}

export interface SupplierFilters {
  companyId?: number;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateSupplierRequest extends CreateSupplierForm {
  companyId?: number;
}

export interface UpdateSupplierRequest extends CreateSupplierForm {
  companyId?: number;
}

export interface SupplierPurchaseOrder {
  id: number;
  orderNumber: string;
  orderDate: Date;
  dueDate?: Date;
  status: string;
  totalAmount: number;
  currency: string;
  linesCount: number;
}

// Supplier API functions
export const suppliersAPI = {
  // Get all suppliers with optional filters
  getAll: async (filters: SupplierFilters = {}): Promise<Supplier[]> => {
    const params = new URLSearchParams();
    
    if (filters.companyId) params.append('companyId', filters.companyId.toString());
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const queryString = params.toString();
    const url = `/api/suppliers${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<Supplier[]>(url);
    return response.data;
  },

  // Get supplier by ID
  getById: async (id: number, companyId?: number): Promise<Supplier> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/suppliers/${id}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<Supplier>(url);
    return response.data;
  },

  // Create new supplier
  create: async (supplier: CreateSupplierRequest): Promise<Supplier> => {
    const response = await api.post<Supplier>('/api/suppliers', supplier);
    return response.data;
  },

  // Update supplier
  update: async (id: number, supplier: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await api.put<Supplier>(`/api/suppliers/${id}`, supplier);
    return response.data;
  },

  // Delete supplier (soft delete)
  delete: async (id: number, companyId?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/suppliers/${id}${queryString ? `?${queryString}` : ''}`;
    
    await api.delete(url);
  },

  // Get supplier purchase orders
  getPurchaseOrders: async (id: number, companyId?: number): Promise<SupplierPurchaseOrder[]> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    
    const queryString = params.toString();
    const url = `/api/suppliers/${id}/purchase-orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<SupplierPurchaseOrder[]>(url);
    return response.data;
  },

  // Get active suppliers only
  getActive: async (companyId?: number): Promise<Supplier[]> => {
    return suppliersAPI.getAll({ companyId, isActive: true });
  },

  // Search suppliers
  search: async (searchTerm: string, companyId?: number): Promise<Supplier[]> => {
    return suppliersAPI.getAll({ companyId, searchTerm });
  }
};

export default suppliersAPI;
