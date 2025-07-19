import type { Customer } from '../types/entities';
import type { PaginatedResponse } from '../types/pagination';

const API_BASE_URL = 'http://localhost:5121/api';

export const customersApi = {
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CompanyId': '1', // TODO: Get from auth context
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const paginatedResponse: PaginatedResponse<Customer> = await response.json();
    return paginatedResponse.data || [];
  },

  async getCustomer(id: number): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CompanyId': '1', // TODO: Get from auth context
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
