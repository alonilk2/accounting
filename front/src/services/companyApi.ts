import axios from 'axios';
import type { Company } from '../types/entities';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5121/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UpdateCompanyRequest {
  name: string;
  israelTaxId: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  fiscalYearStartMonth: number;
  timeZone: string;
}

export interface ValidateTaxIdRequest {
  taxId: string;
  excludeCompanyId?: number;
}

export interface TaxIdValidationResponse {
  isValid: boolean;
  errorMessage: string;
}

export interface CompanyDashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  totalCustomers: number;
  totalSuppliers: number;
  pendingInvoices: number;
  overdueInvoices: number;
  lastUpdated: Date;
}

export interface CreateCompanyRequest {
  name: string;
  israelTaxId: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  fiscalYearStartMonth: number;
  timeZone: string;
  subscriptionPlan?: string;
}

export interface UpdateCompanySettingsRequest {
  currency?: string;
  fiscalYearStartMonth?: number;
  timeZone?: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
}

export interface UpdateCompanyActivationRequest {
  isActive: boolean;
  reason?: string;
}

export interface UpdateSubscriptionRequest {
  subscriptionPlan: string;
  expiresAt?: Date;
}

export interface CheckFeatureAccessRequest {
  feature: string;
}

export interface FeatureAccessResponse {
  hasAccess: boolean;
  reason?: string;
  expiresAt?: Date;
}

export interface CompanySearchCriteria {
  name?: string;
  taxId?: string;
  city?: string;
  subscriptionPlan?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  orderBy?: string;
  orderDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface CompanySettings {
  companyId: number;
  currency: string;
  fiscalYearStartMonth: number;
  timeZone: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class CompanyApiService {
  /**
   * Get company by ID
   */
  async getCompany(id: number): Promise<Company> {
    const response = await api.get(`/company/${id}`);
    return response.data;
  }

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    const response = await api.post('/company', data);
    return response.data;
  }

  /**
   * Get all companies (admin only)
   */
  async getCompanies(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<Company[]> {
    const response = await api.get('/company', {
      params: { pageNumber, pageSize, searchTerm }
    });
    return response.data;
  }

  /**
   * Update company details
   */
  async updateCompany(id: number, data: UpdateCompanyRequest): Promise<Company> {
    const response = await api.put(`/company/${id}`, data);
    return response.data;
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(id: number, data: UpdateCompanySettingsRequest): Promise<Company> {
    const response = await api.put(`/company/${id}/settings`, data);
    return response.data;
  }

  /**
   * Update company activation status
   */
  async updateCompanyActivation(id: number, data: UpdateCompanyActivationRequest): Promise<Company> {
    const response = await api.put(`/company/${id}/activation`, data);
    return response.data;
  }

  /**
   * Get company dashboard statistics
   */
  async getDashboardStats(id: number): Promise<CompanyDashboardStats> {
    const response = await api.get(`/company/${id}/dashboard-stats`);
    return response.data;
  }

  /**
   * Get company by tax ID
   */
  async getCompanyByTaxId(taxId: string): Promise<Company> {
    const response = await api.get(`/company/by-tax-id/${taxId}`);
    return response.data;
  }

  /**
   * Get company settings
   */
  async getCompanySettings(id: number): Promise<CompanySettings> {
    const response = await api.get(`/company/${id}/settings`);
    return response.data;
  }

  /**
   * Update company subscription
   */
  async updateCompanySubscription(id: number, data: UpdateSubscriptionRequest): Promise<Company> {
    const response = await api.put(`/company/${id}/subscription`, data);
    return response.data;
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(id: number, data: CheckFeatureAccessRequest): Promise<FeatureAccessResponse> {
    const response = await api.post(`/company/${id}/check-feature-access`, data);
    return response.data;
  }

  /**
   * Search companies by criteria
   */
  async searchCompanies(criteria: CompanySearchCriteria): Promise<Company[]> {
    const response = await api.post('/company/search', criteria);
    return response.data;
  }

  /**
   * Validate Israeli Tax ID
   */
  async validateTaxId(data: ValidateTaxIdRequest): Promise<TaxIdValidationResponse> {
    const response = await api.post('/company/validate-tax-id', data);
    return response.data;
  }
}

export const companyApi = new CompanyApiService();
