import type { PaginatedResponse } from '../types/pagination';

/**
 * Utility functions for handling paginated API responses consistently
 * Reduces code duplication in service calls and component state management
 */

/**
 * Extract data array from paginated response safely
 * @param response - API response that may be paginated or direct array
 * @returns Array of data items
 */
export function extractPaginatedData<T>(response: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  return response.data || [];
}

/**
 * Create loading states for paginated lists
 */
export interface PaginatedListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  totalCount: number;
  hasMore: boolean;
}

/**
 * Initialize paginated list state
 */
export function createPaginatedListState<T>(): PaginatedListState<T> {
  return {
    items: [],
    loading: false,
    error: null,
    page: 1,
    totalCount: 0,
    hasMore: false
  };
}

/**
 * Update paginated list state from API response
 */
export function updatePaginatedListState<T>(
  currentState: PaginatedListState<T>,
  response: PaginatedResponse<T>,
  append = false
): PaginatedListState<T> {
  const data = extractPaginatedData(response);
  
  return {
    ...currentState,
    items: append ? [...currentState.items, ...data] : data,
    loading: false,
    error: null,
    totalCount: response.totalCount || data.length,
    hasMore: response.hasNextPage || false,
    page: response.page || 1
  };
}

/**
 * Set loading state
 */
export function setPaginatedListLoading<T>(
  currentState: PaginatedListState<T>,
  loading: boolean
): PaginatedListState<T> {
  return {
    ...currentState,
    loading,
    error: loading ? null : currentState.error
  };
}

/**
 * Set error state
 */
export function setPaginatedListError<T>(
  currentState: PaginatedListState<T>,
  error: string
): PaginatedListState<T> {
  return {
    ...currentState,
    loading: false,
    error
  };
}

/**
 * Hook for managing paginated list state
 */
import { useState, useCallback } from 'react';

export function usePaginatedList<T>() {
  const [state, setState] = useState<PaginatedListState<T>>(createPaginatedListState<T>());

  const setLoading = useCallback((loading: boolean) => {
    setState(current => setPaginatedListLoading(current, loading));
  }, []);

  const setError = useCallback((error: string) => {
    setState(current => setPaginatedListError(current, error));
  }, []);

  const setData = useCallback((response: PaginatedResponse<T>, append = false) => {
    setState(current => updatePaginatedListState(current, response, append));
  }, []);

  const reset = useCallback(() => {
    setState(createPaginatedListState<T>());
  }, []);

  return {
    state,
    setLoading,
    setError,
    setData,
    reset
  };
}

/**
 * Standard API call wrapper for paginated endpoints
 */
export async function callPaginatedAPI<T>(
  apiCall: () => Promise<PaginatedResponse<T>>,
  onSuccess: (response: PaginatedResponse<T>) => void,
  onError: (error: string) => void,
  onLoading: (loading: boolean) => void
): Promise<void> {
  try {
    onLoading(true);
    const response = await apiCall();
    onSuccess(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    onError(message);
  } finally {
    onLoading(false);
  }
}