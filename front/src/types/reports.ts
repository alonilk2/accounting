// Customer Statement types for TypeScript
export interface CustomerStatementRequest {
  customerId: number;
  fromDate: string;
  toDate: string;
  includeZeroBalanceTransactions: boolean;
}

export interface CustomerStatement {
  customer: CustomerInfo;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: CustomerTransaction[];
  summary: CustomerStatementSummary;
}

export interface CustomerInfo {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface CustomerTransaction {
  date: string;
  transactionType: string;
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod?: string;
  status: string;
}

export interface CustomerStatementSummary {
  totalDebits: number;
  totalCredits: number;
  netChange: number;
  totalTransactions: number;
  averageTransactionAmount: number;
  monthlyActivity: MonthlyActivity[];
}

export interface MonthlyActivity {
  year: number;
  month: number;
  monthName: string;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  transactionCount: number;
}
