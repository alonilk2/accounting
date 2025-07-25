import type { Item } from '../types/entities';
import type { PaginatedResponse } from '../types/pagination';
import api from './api';

export interface ItemsFilter {
  companyId?: number;
  isActive?: boolean;
  isSellable?: boolean;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedItemsResponse extends PaginatedResponse<Item> {
  filters?: ItemsFilter;
}

class ItemsApi {
  async getItems(filters: ItemsFilter = {}): Promise<Item[]> {
    try {
      const params: Record<string, unknown> = {};
      
      if (filters.companyId) params.companyId = filters.companyId;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;
      if (filters.isSellable !== undefined) params.isSellable = filters.isSellable;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.pageSize = filters.pageSize;

      const response = await api.get('/items', { params });
      
      // Handle both paginated and non-paginated responses
      if (response.data?.data) {
        return response.data.data; // Paginated response
      }
      return response.data; // Non-paginated response
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  async getPaginatedItems(filters: ItemsFilter = {}): Promise<PaginatedItemsResponse> {
    try {
      const params: Record<string, unknown> = {};
      
      if (filters.companyId) params.companyId = filters.companyId;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;
      if (filters.isSellable !== undefined) params.isSellable = filters.isSellable;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.pageSize) params.pageSize = filters.pageSize;

      const response = await api.get('/items/paginated', { params });
      
      return {
        data: response.data.data,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalCount: response.data.totalCount,
        totalPages: response.data.totalPages,
        hasPreviousPage: response.data.hasPreviousPage,
        hasNextPage: response.data.hasNextPage,
        filters
      };
    } catch (error) {
      console.error('Error fetching paginated items:', error);
      throw error;
    }
  }

  async getItem(id: number, companyId?: number): Promise<Item> {
    try {
      const params: Record<string, unknown> = {};
      if (companyId) params.companyId = companyId;

      const response = await api.get(`/items/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      throw error;
    }
  }
}

export const itemsApi = new ItemsApi();
export default itemsApi;
