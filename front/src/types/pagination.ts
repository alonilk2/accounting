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
