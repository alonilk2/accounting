// Pagination types for frontend
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Backend API Response wrapper (includes timestamp field)
export interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Type alias for paginated API responses - this represents the full nested structure
export type PaginatedApiResponse<T> = BackendApiResponse<PaginatedResponse<T>>;

export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export interface CustomerFilters extends PaginationRequest {
  companyId?: number;
  isActive?: boolean;
}

export interface SupplierFilters extends PaginationRequest {
  companyId?: number;
  isActive?: boolean;
}

export interface ItemFilters extends PaginationRequest {
  category?: string;
  isActive?: boolean;
}

export interface QuoteFilters extends PaginationRequest {
  customerId?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
}
