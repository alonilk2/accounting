import type { Customer } from '../types/entities';

const API_BASE_URL = 'https://localhost:5121/api';

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

    return response.json();
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
