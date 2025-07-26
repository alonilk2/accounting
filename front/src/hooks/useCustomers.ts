import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import type { Customer } from '../types/entities';
import type { PaginatedResponse, CustomerFilters } from '../types/pagination';

export interface UseCustomersResult {
  customers: Customer[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: number, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  refreshCustomers: (filters?: CustomerFilters) => Promise<void>;
  loadCustomers: (filters: CustomerFilters) => Promise<PaginatedResponse<Customer>>;
}

export const useCustomers = (): UseCustomersResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async (filters: CustomerFilters): Promise<PaginatedResponse<Customer>> => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.getAll(filters);
      
      // Update state with the new data
      setCustomers(response.data);
      setTotalCount(response.totalCount);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMessage);
      console.error('Error loading customers:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomers = useCallback(async (filters?: CustomerFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.getAll(filters || { page: 1, pageSize: 25 });
      setCustomers(response.data);
      setTotalCount(response.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
      setError(errorMessage);
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const newCustomer = await customersAPI.create(customerData);
      // Refresh to get updated pagination
      await refreshCustomers();
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      console.error('Error creating customer:', err);
      throw err;
    }
  }, [refreshCustomers]);

  const updateCustomer = useCallback(async (id: number, customerData: Partial<Customer>) => {
    try {
      setError(null);
      const updatedCustomer = await customersAPI.update(id, customerData);
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      return updatedCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      console.error('Error updating customer:', err);
      throw err;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: number) => {
    try {
      setError(null);
      await customersAPI.delete(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, []);

  // Load customers on mount
  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  return {
    customers,
    totalCount,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
    loadCustomers,
  };
};
