import { useState, useEffect, useCallback } from 'react';
import { customersAPI } from '../services/api';
import type { Customer } from '../types/entities';

export interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  createCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: number, customer: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

export const useCustomers = (): UseCustomersResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customersAPI.getAll();
      setCustomers(data);
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
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      console.error('Error creating customer:', err);
      throw err;
    }
  }, []);

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
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
  };
};
