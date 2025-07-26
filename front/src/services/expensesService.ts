import api from './api';

// Types for Expense API
export type ExpenseCategory = 1306 | 1307 | 1308 | 1310 | 1320 | 1330 | 1340 | 1350 | 1360 | 1371 | 1372 | 1390 | 1400 | 1450;
export type ExpenseStatus = 1 | 2 | 3 | 4 | 5 | 6;

export const EXPENSE_CATEGORIES = {
  SALARY: 1306 as ExpenseCategory,
  SALARY_ADDONS: 1307 as ExpenseCategory,
  EMPLOYEE_OPTIONS: 1308 as ExpenseCategory,
  THIRD_PARTY_JOBS: 1310 as ExpenseCategory,
  LOCAL_PURCHASES: 1320 as ExpenseCategory,
  RAW_MATERIAL_PURCHASES: 1330 as ExpenseCategory,
  FOREIGN_SUPPLY: 1340 as ExpenseCategory,
  CURRENCY_RATES_PURCHASES: 1350 as ExpenseCategory,
  WARRANTS_EXPENSES: 1360 as ExpenseCategory,
  RELATED_LOCAL_EXPENSES: 1371 as ExpenseCategory,
  RELATED_FOREIGN_EXPENSES: 1372 as ExpenseCategory,
  OTHER_EXPENSES: 1390 as ExpenseCategory,
  INVENTORY_START: 1400 as ExpenseCategory,
  INVENTORY_END: 1450 as ExpenseCategory,
} as const;

export const EXPENSE_STATUSES = {
  DRAFT: 1 as ExpenseStatus,
  PENDING: 2 as ExpenseStatus,
  APPROVED: 3 as ExpenseStatus,
  PAID: 4 as ExpenseStatus,
  REJECTED: 5 as ExpenseStatus,
  CANCELLED: 6 as ExpenseStatus,
} as const;

export interface Expense {
  id: number;
  companyId: number;
  expenseNumber: string;
  expenseDate: string;
  supplierId?: number;
  supplierName?: string;
  category: ExpenseCategory;
  categoryName: string;
  description: string;
  descriptionHebrew?: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  receiptNumber?: string;
  purchaseOrderId?: number;
  accountId?: number;
  accountName?: string;
  status: ExpenseStatus;
  statusName: string;
  approvedDate?: string;
  approvedBy?: string;
  paidDate?: string;
  paymentReference?: string;
  notes?: string;
  attachmentPath?: string;
  tags?: string;
  isTaxDeductible: boolean;
  isRecurring: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  expenseDate: string;
  supplierId?: number;
  supplierName?: string;
  category: ExpenseCategory;
  description: string;
  descriptionHebrew?: string;
  amount: number;
  vatRate?: number;
  currency?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  purchaseOrderId?: number;
  accountId?: number;
  status?: ExpenseStatus;
  notes?: string;
  tags?: string;
  isTaxDeductible?: boolean;
  isRecurring?: boolean;
}

export interface UpdateExpenseRequest {
  expenseDate: string;
  supplierId?: number;
  supplierName?: string;
  category: ExpenseCategory;
  description: string;
  descriptionHebrew?: string;
  amount: number;
  vatRate?: number;
  currency?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  purchaseOrderId?: number;
  accountId?: number;
  notes?: string;
  tags?: string;
  isTaxDeductible?: boolean;
  isRecurring?: boolean;
}

export interface UpdateExpenseStatusRequest {
  status: ExpenseStatus;
  notes?: string;
  paymentReference?: string;
  paidDate?: string;
}

export interface ExpenseCategoryReport {
  category: ExpenseCategory;
  categoryName: string;
  categoryNameHebrew: string;
  totalAmount: number;
  vatAmount: number;
  expenseCount: number;
  averageAmount: number;
}

export interface MonthlyExpenseReport {
  year: number;
  month: number;
  monthName: string;
  totalAmount: number;
  vatAmount: number;
  expenseCount: number;
  categories: ExpenseCategoryReport[];
}

export interface ExpenseSummary {
  fromDate: string;
  toDate: string;
  totalAmount: number;
  totalVat: number;
  netAmount: number;
  totalExpenses: number;
  averageExpense: number;
  topCategories: ExpenseCategoryReport[];
  monthlyBreakdown: MonthlyExpenseReport[];
}

export interface BulkApproveExpensesRequest {
  expenseIds: number[];
  notes?: string;
}

export interface BulkPayExpensesRequest {
  expenseIds: number[];
  paymentDate: string;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
}

export interface BulkOperationResult {
  totalRequested: number;
  successfullyProcessed: number;
  message: string;
  isSuccess: boolean;
}

export interface ExpenseFilters {
  fromDate?: string;
  toDate?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  supplierId?: number;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExpenseNumber {
  expenseNumber: string;
}

// Expense Category names in Hebrew - matching backend ExpenseService.GetCategoryNameHebrew
export const ExpenseCategoryNames: Record<number, { en: string; he: string }> = {
  1306: { en: '1306 - Salary', he: '1306 - שכר עבודה' },
  1307: { en: '1307 - Salary Addons', he: '1307 - הוצאות שכר בגין אופציות לעובדים' },
  1308: { en: '1308 - Employees Options', he: '1308 - עבודות חוץ וקבלני משנה' },
  1310: { en: '1310 - Third Party Jobs', he: '1310 - דמי מדים וביגוד' },
  1320: { en: '1320 - Local Purchases', he: '1320 - קניות סחורה בארץ' },
  1330: { en: '1330 - Raw Materials Purchases', he: '1330 - קניות חומרי גלם וחומרי בנייה בארץ ובחו\'\'ל' },
  1340: { en: '1340 - Foreign Supply', he: '1340 - קניות סחורה מחו\'\'ל' },
  1350: { en: '1350 - Currency Rates Purchases', he: '1350 - הוצאות מטבע חוץ' },
  1360: { en: '1360 - Warrants Expenses', he: '1360 - הוצאות לאחריות ותביעות' },
  1371: { en: '1371 - Related Local Expenses', he: '1371 - קניות מצדדים קשורים בארץ' },
  1372: { en: '1372 - Related Foreign Expenses', he: '1372 - קניות מצדדים קשורים בחו\'\'ל' },
  1390: { en: '1390 - Other Expenses', he: '1390 - הוצאות פיננסיות אחרות' },
  1400: { en: '1400 - Inventory Start', he: '1400 - מלאי בתחילת התקופה' },
  1450: { en: '1450 - Inventory End', he: '1450 - מלאי בסוף התקופה' },
};

// Expense Status names in Hebrew
export const ExpenseStatusNames: Record<number, { en: string; he: string }> = {
  1: { en: 'Draft', he: 'טיוטה' },
  2: { en: 'Pending Approval', he: 'ממתין לאישור' },
  3: { en: 'Approved', he: 'מאושר' },
  4: { en: 'Paid', he: 'שולם' },
  5: { en: 'Rejected', he: 'נדחה' },
  6: { en: 'Cancelled', he: 'בוטל' },
};

// API Service
export const expensesApi = {
  // Get paginated expenses with filtering
  getExpenses: async (filters: ExpenseFilters = {}): Promise<PaginatedResponse<Expense>> => {
    const params = new URLSearchParams();
    
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.category !== undefined) params.append('category', filters.category.toString());
    if (filters.status !== undefined) params.append('status', filters.status.toString());
    if (filters.supplierId) params.append('supplierId', filters.supplierId.toString());
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await api.get(`/expenses?${params.toString()}`);
    return response.data;
  },

  // Get expense by ID
  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create new expense
  createExpense: async (expense: CreateExpenseRequest): Promise<Expense> => {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  // Update expense
  updateExpense: async (id: number, expense: UpdateExpenseRequest): Promise<Expense> => {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
  },

  // Update expense status
  updateExpenseStatus: async (id: number, statusUpdate: UpdateExpenseStatusRequest): Promise<Expense> => {
    const response = await api.patch(`/expenses/${id}/status`, statusUpdate);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  // Bulk approve expenses
  bulkApproveExpenses: async (request: BulkApproveExpensesRequest): Promise<BulkOperationResult> => {
    const response = await api.post('/expenses/bulk-approve', request);
    return response.data;
  },

  // Bulk pay expenses
  bulkPayExpenses: async (request: BulkPayExpensesRequest): Promise<BulkOperationResult> => {
    const response = await api.post('/expenses/bulk-pay', request);
    return response.data;
  },

  // Get expense summary
  getExpenseSummary: async (fromDate: string, toDate: string): Promise<ExpenseSummary> => {
    const response = await api.get(`/expenses/summary?fromDate=${fromDate}&toDate=${toDate}`);
    return response.data;
  },

  // Get expenses by category report
  getExpensesByCategory: async (fromDate: string, toDate: string): Promise<ExpenseCategoryReport[]> => {
    const response = await api.get(`/expenses/reports/by-category?fromDate=${fromDate}&toDate=${toDate}`);
    return response.data;
  },

  // Get monthly expense report
  getMonthlyExpenseReport: async (year: number): Promise<MonthlyExpenseReport[]> => {
    const response = await api.get(`/expenses/reports/monthly?year=${year}`);
    return response.data;
  },

  // Get pending approval expenses
  getPendingApprovalExpenses: async (): Promise<Expense[]> => {
    const response = await api.get('/expenses/pending-approval');
    return response.data;
  },

  // Get overdue expenses
  getOverdueExpenses: async (): Promise<Expense[]> => {
    const response = await api.get('/expenses/overdue');
    return response.data;
  },

  // Get next expense number
  getNextExpenseNumber: async (): Promise<ExpenseNumber> => {
    const response = await api.get('/expenses/next-number');
    return response.data;
  },
};

export default expensesApi;
