import type { Item } from '../types/entities';
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
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
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
