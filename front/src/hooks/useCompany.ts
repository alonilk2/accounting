import { useState, useCallback } from 'react';
import { companyApi, type UpdateCompanyRequest, type CompanyDashboardStats } from '../services/companyApi';
import type { Company } from '../types/entities';

export interface UseCompanyReturn {
  company: Company | null;
  stats: CompanyDashboardStats | null;
  loading: boolean;
  error: string | null;
  getCompany: (id: number) => Promise<void>;
  updateCompany: (id: number, data: UpdateCompanyRequest) => Promise<Company | null>;
  getDashboardStats: (id: number) => Promise<void>;
  validateTaxId: (taxId: string, excludeCompanyId?: number) => Promise<{ isValid: boolean; errorMessage: string }>;
}

export const useCompany = (): UseCompanyReturn => {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCompany = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const companyData = await companyApi.getCompany(id);
      setCompany(companyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת נתוני החברה';
      setError(errorMessage);
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (id: number, data: UpdateCompanyRequest): Promise<Company | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedCompany = await companyApi.updateCompany(id, data);
      setCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון נתוני החברה';
      setError(errorMessage);
      console.error('Error updating company:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboardStats = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await companyApi.getDashboardStats(id);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת סטטיסטיקות החברה';
      setError(errorMessage);
      console.error('Error fetching company stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateTaxId = useCallback(async (taxId: string, excludeCompanyId?: number) => {
    try {
      const result = await companyApi.validateTaxId({ taxId, excludeCompanyId });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בבדיקת מספר עוסק';
      console.error('Error validating tax ID:', err);
      return { isValid: false, errorMessage };
    }
  }, []);

  return {
    company,
    stats,
    loading,
    error,
    getCompany,
    updateCompany,
    getDashboardStats,
    validateTaxId,
  };
};
