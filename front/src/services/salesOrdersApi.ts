// Sales Orders API service - שירות API להזמנות מכירה
import type { SalesOrder, SalesSummary, SalesOrderStatus } from '../types/entities';
import type { PaginatedResponse } from '../types/pagination';
import api from './api';

// Backend response interface
interface SalesOrderResponse {
  id: number;
  companyId: number;
  customerId: number;
  customerName: string;
  agentId?: number;
  agentName?: string;
  orderNumber: string;
  orderDate: string;
  dueDate?: string;
  deliveryDate?: string;
  status: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  lines: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderRequest {
  customerId: number;
  agentId?: number;
  orderDate?: Date;
  dueDate?: Date;
  deliveryDate?: Date;
  status?: SalesOrderStatus;
  currency?: string;
  notes?: string;
  lines: CreateSalesOrderLineRequest[];
}

export interface CreateSalesOrderLineRequest {
  itemId: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
}

export interface UpdateSalesOrderStatusRequest {
  status: SalesOrderStatus;
}

export interface SalesOrdersFilter {
  companyId?: number;
  status?: SalesOrderStatus;
  customerId?: number;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

class SalesOrdersApi {
  
  /**
   * Get all sales orders with filtering and pagination
   */
  async getSalesOrders(filters: SalesOrdersFilter = {}): Promise<PaginatedResponse<SalesOrder>> {
    try {
      const params: Record<string, unknown> = {};
      
      if (filters.companyId) params.companyId = filters.companyId;
      if (filters.status) params.status = filters.status;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.pageSize = filters.pageSize;
      if (filters.searchTerm) params.searchTerm = filters.searchTerm;

      const response = await api.get('/sales/orders', { params });
      
      // The backend returns a PaginatedResponse wrapped in a success response
      const paginatedData = response.data.data;
      
      // Convert dates from strings to Date objects for the data array
      const convertedData = paginatedData.data.map((order: SalesOrderResponse) => ({
        ...order,
        orderDate: new Date(order.orderDate),
        dueDate: order.dueDate ? new Date(order.dueDate) : undefined,
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt)
      }));

      return {
        ...paginatedData,
        data: convertedData
      };
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw error;
    }
  }

  /**
   * Get specific sales order by ID
   */
  async getSalesOrder(id: number, companyId?: number): Promise<SalesOrder> {
    try {
      const params: Record<string, unknown> = {};
      if (companyId) params.companyId = companyId;

      const response = await api.get(`/sales/orders/${id}`, { params });
      
      return {
        ...response.data,
        orderDate: new Date(response.data.orderDate),
        dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
        deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error fetching sales order ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new sales order
   */
  async createSalesOrder(request: CreateSalesOrderRequest, companyId?: number): Promise<SalesOrder> {
    try {
      const params: Record<string, unknown> = {};
      if (companyId) params.companyId = companyId;

      // Format dates for API
      const formattedRequest = {
        ...request,
        orderDate: request.orderDate?.toISOString(),
        dueDate: request.dueDate?.toISOString(),
        deliveryDate: request.deliveryDate?.toISOString()
      };

      const response = await api.post('/sales/orders', formattedRequest, { params });
      
      return {
        ...response.data,
        orderDate: new Date(response.data.orderDate),
        dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
        deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error('Error creating sales order:', error);
      throw error;
    }
  }

  /**
   * Update sales order status
   */
  async updateSalesOrderStatus(
    id: number, 
    request: UpdateSalesOrderStatusRequest, 
    companyId?: number
  ): Promise<SalesOrder> {
    try {
      const params: Record<string, unknown> = {};
      if (companyId) params.companyId = companyId;

      const response = await api.put(`/sales/orders/${id}/status`, request, { params });
      
      return {
        ...response.data,
        orderDate: new Date(response.data.orderDate),
        dueDate: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
        deliveryDate: response.data.deliveryDate ? new Date(response.data.deliveryDate) : undefined,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    } catch (error) {
      console.error(`Error updating sales order ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Get sales orders by customer
   */
  async getSalesOrdersByCustomer(customerId: number, companyId?: number): Promise<SalesOrder[]> {
    try {
      const paginatedResponse = await this.getSalesOrders({ customerId, companyId });
      return paginatedResponse.data;
    } catch (error) {
      console.error(`Error fetching sales orders for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get overdue sales orders
   */
  async getOverdueSalesOrders(companyId?: number): Promise<SalesOrder[]> {
    try {
      const response = await api.get('/sales/overdue', { 
        params: companyId ? { companyId } : {} 
      });
      
      return response.data.map((order: SalesOrderResponse) => ({
        ...order,
        orderDate: new Date(order.orderDate),
        dueDate: order.dueDate ? new Date(order.dueDate) : undefined,
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt)
      }));
    } catch (error) {
      console.error('Error fetching overdue sales orders:', error);
      throw error;
    }
  }

  /**
   * Get sales summary for date range
   */
  async getSalesSummary(
    fromDate: Date, 
    toDate: Date, 
    companyId?: number
  ): Promise<SalesSummary> {
    try {
      const params: Record<string, unknown> = {
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0]
      };
      if (companyId) params.companyId = companyId;

      const response = await api.get('/sales/summary', { params });
      
      return {
        ...response.data,
        fromDate: new Date(response.data.fromDate),
        toDate: new Date(response.data.toDate)
      };
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      throw error;
    }
  }

  /**
   * Delete sales order (soft delete)
   */
  async deleteSalesOrder(id: number, companyId?: number): Promise<void> {
    try {
      const params: Record<string, unknown> = {};
      if (companyId) params.companyId = companyId;

      await api.delete(`/sales/orders/${id}`, { params });
    } catch (error) {
      console.error(`Error deleting sales order ${id}:`, error);
      throw error;
    }
  }
}

export const salesOrdersApi = new SalesOrdersApi();
export default salesOrdersApi;
