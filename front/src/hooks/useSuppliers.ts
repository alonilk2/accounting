import { useState, useEffect, useCallback } from 'react';
import { suppliersAPI } from '../services/api';
import type { Supplier } from '../types/entities';
import type { SupplierFilters } from '../types/pagination';
import type { CreateSupplierRequest, UpdateSupplierRequest } from '../services/api';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = useCallback(async (params?: SupplierFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getAll(params);
      // Response is PaginatedResponse<Supplier> with data array and pagination info
      setSuppliers(response.data || []);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הספקים');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = useCallback(async (supplierData: CreateSupplierRequest) => {
    try {
      setLoading(true);
      setError(null);
      const newSupplier = await suppliersAPI.create(supplierData);
      setSuppliers(prev => [...prev, newSupplier]);
      return newSupplier;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הספק');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSupplier = useCallback(async (id: number, supplierData: UpdateSupplierRequest) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSupplier = await suppliersAPI.update(id, supplierData);
      setSuppliers(prev => prev.map(supplier => supplier.id === id ? updatedSupplier : supplier));
      return updatedSupplier;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון הספק');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSupplier = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await suppliersAPI.delete(id);
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת הספק');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSuppliers = useCallback((params?: SupplierFilters) => {
    loadSuppliers(params);
  }, [loadSuppliers]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return {
    suppliers,
    totalCount,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refreshSuppliers,
    loadSuppliers,
  };
};
