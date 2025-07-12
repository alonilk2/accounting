import type { CustomerStatement, CustomerStatementRequest } from '../types/reports';

const API_BASE_URL = 'https://localhost:5121/api';

export const reportsApi = {
  async getCustomerStatement(request: CustomerStatementRequest): Promise<CustomerStatement> {
    const response = await fetch(`${API_BASE_URL}/reports/customer-statement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CompanyId': '1', // TODO: Get from auth context
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getCustomerStatementByParams(
    customerId: number, 
    fromDate: string, 
    toDate: string, 
    includeZeroBalanceTransactions: boolean = true
  ): Promise<CustomerStatement> {
    const params = new URLSearchParams({
      fromDate,
      toDate,
      includeZeroBalanceTransactions: includeZeroBalanceTransactions.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/reports/customer-statement/${customerId}?${params}`, {
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
