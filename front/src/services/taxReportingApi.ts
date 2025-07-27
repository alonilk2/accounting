import { api } from './api';

// Types for Form 6111 Tax Reporting
export interface Form6111Request {
  taxYear: number;
  periodStartDate: string;
  periodEndDate: string;
  includeDraftTransactions?: boolean;
  currency?: string;
  notes?: string;
}

export interface Form6111ProfitLoss {
  totalRevenue: number;
  salesRevenue: number;
  serviceRevenue: number;
  otherRevenue: number;
  totalCostOfSales: number;
  openingInventory: number;
  purchases: number;
  closingInventory: number;
  totalManufacturingCosts: number;
  rAndDExpenses: number;
  totalSalesExpenses: number;
  totalAdministrativeExpenses: number;
  totalFinanceExpenses: number;
  totalFinanceIncome: number;
  otherIncome: number;
  otherExpenses: number;
  totalProfitLoss: number;
  currentTaxExpense: number;
  deferredTaxExpense: number;
  grossProfit: number;
  operatingProfit: number;
  netFinanceResult: number;
}

export interface Form6111TaxAdjustment {
  profitLossBeforeTax: number;
  ifrsAdjustments: number;
  israeliGAAPProfit: number;
  nonDeductibleExpenses: number;
  timingDifferencesAdditions: number;
  depreciationDifferences: number;
  totalTaxAdjustments: number;
  taxableIncome: number;
  finalTaxableIncome: number;
  partnershipShare: number;
  adjustmentDetails: Array<{
    fieldCode: string;
    description: string;
    amount: number;
    reason: string;
  }>;
}

export interface Form6111BalanceSheet {
  totalCurrentAssets: number;
  cashAndEquivalents: number;
  securities: number;
  accountsReceivable: number;
  otherReceivables: number;
  inventory: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  banksAndShortTermLoans: number;
  suppliersAndServices: number;
  otherPayables: number;
  totalLongTermLiabilities: number;
  totalEquity: number;
  shareCapital: number;
  retainedEarnings: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  balanceDifference: number;
}

export interface Form6111Response {
  id: number;
  companyId: number;
  taxYear: number;
  periodStartDate: string;
  periodEndDate: string;
  generatedAt: string;
  generatedBy: string;
  status: 'Draft' | 'Generated' | 'Submitted' | 'Accepted' | 'Rejected';
  profitLoss: Form6111ProfitLoss;
  taxAdjustment: Form6111TaxAdjustment;
  balanceSheet: Form6111BalanceSheet;
  notes?: string;
  validationWarnings: string[];
  dataHash?: string;
}

export interface Form6111ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infoMessages: string[];
  hasCriticalErrors: boolean;
  isBalanceSheetBalanced: boolean;
  allRequiredFieldsPresent: boolean;
  dataConsistencyPassed: boolean;
}

export interface ProfitLossCalculationRequest {
  startDate: string;
  endDate: string;
}

export interface BalanceSheetCalculationRequest {
  asOfDate: string;
}

export interface UpdateForm6111StatusRequest {
  status: 'Draft' | 'Generated' | 'Submitted' | 'Accepted' | 'Rejected';
  notes?: string;
}

export class TaxReportingApiService {
  /**
   * Generate a new Form 6111 report
   */
  async generateForm6111(request: Form6111Request): Promise<Form6111Response> {
    const response = await api.post('/api/TaxReporting/form6111/generate', request);
    return response.data;
  }

  /**
   * Get existing Form 6111 reports
   */
  async getForm6111Reports(taxYear?: number): Promise<Form6111Response[]> {
    const params = taxYear ? { taxYear } : {};
    const response = await api.get('/api/TaxReporting/form6111', { params });
    return response.data;
  }

  /**
   * Get a specific Form 6111 report by ID
   */
  async getForm6111ById(form6111Id: number): Promise<Form6111Response> {
    const response = await api.get(`/api/TaxReporting/form6111/${form6111Id}`);
    return response.data;
  }

  /**
   * Validate a Form 6111 report
   */
  async validateForm6111(form6111Id: number): Promise<Form6111ValidationResult> {
    const response = await api.post(`/api/TaxReporting/form6111/${form6111Id}/validate`);
    return response.data;
  }

  /**
   * Export a Form 6111 report to file
   */
  async exportForm6111(form6111Id: number, format: string = 'JSON'): Promise<void> {
    const response = await api.get(`/api/TaxReporting/form6111/${form6111Id}/export`, {
      params: { format },
      responseType: 'blob'
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or generate one
    const contentDisposition = response.headers['content-disposition'];
    let filename = `Form6111_${form6111Id}.${format.toLowerCase()}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Update Form 6111 status
   */
  async updateForm6111Status(
    form6111Id: number, 
    request: UpdateForm6111StatusRequest
  ): Promise<Form6111Response> {
    const response = await api.put(`/api/TaxReporting/form6111/${form6111Id}/status`, request);
    return response.data;
  }

  /**
   * Calculate Profit & Loss for a specific period
   */
  async calculateProfitLoss(request: ProfitLossCalculationRequest): Promise<Form6111ProfitLoss> {
    const response = await api.post('/api/TaxReporting/profit-loss/calculate', request);
    return response.data;
  }

  /**
   * Calculate Balance Sheet as of a specific date
   */
  async calculateBalanceSheet(request: BalanceSheetCalculationRequest): Promise<Form6111BalanceSheet> {
    const response = await api.post('/api/TaxReporting/balance-sheet/calculate', request);
    return response.data;
  }

  /**
   * Get Israeli standard chart of accounts mapping
   */
  async getIsraeliAccountMapping(): Promise<Record<string, string>> {
    const response = await api.get('/api/TaxReporting/chart-of-accounts/israeli-mapping');
    return response.data;
  }
}

// Export singleton instance
export const taxReportingApi = new TaxReportingApiService();