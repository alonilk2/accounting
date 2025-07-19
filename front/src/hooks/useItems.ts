import { useState, useEffect, useCallback } from 'react';
import { itemsAPI } from '../services/api';
import type { Item } from '../types/entities';
import type { ItemFilters } from '../types/pagination';

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (params?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemsAPI.getAll(params);
      setItems(response.data);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת המוצרים');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async (params?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    return loadItems(params);
  }, [loadItems]);

  const createItem = useCallback(async (itemData: Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      const newItem = await itemsAPI.create(itemData);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המוצר');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (id: number, itemData: Partial<Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedItem = await itemsAPI.update(id, itemData);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון המוצר');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await itemsAPI.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת המוצר');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustStock = useCallback(async (id: number, quantityChange: number, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedItem = await itemsAPI.adjustStock(id, quantityChange, reason);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון המלאי');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBelowReorderPoint = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lowStockItems = await itemsAPI.getBelowReorderPoint();
      return lowStockItems;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת מוצרים עם מלאי נמוך');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshItems = useCallback((params?: ItemFilters) => {
    loadItems(params);
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    totalCount,
    loading,
    error,
    fetchItems,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    adjustStock,
    getBelowReorderPoint,
    refreshItems,
  };
};
