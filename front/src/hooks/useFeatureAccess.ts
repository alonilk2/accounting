import { useCallback, useEffect, useState } from 'react';
import { companyApi, type FeatureAccessResponse } from '../services/companyApi';
import { useAuthStore } from '../stores';

export interface UseFeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  reasonCode?: string;
  currentPlan?: string;
  upgradePath?: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useFeatureAccess = (feature: string): UseFeatureAccessResult => {
  const { company } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<FeatureAccessResponse>({ hasAccess: false });

  const refresh = useCallback(async () => {
    if (!company?.id) {
      setAccess({
        hasAccess: false,
        reason: 'Company context is missing.',
        reasonCode: 'company_context_missing',
        feature,
        upgradePath: '/company-management',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await companyApi.checkFeatureAccess(company.id, { feature });
      setAccess(response);
    } catch {
      setAccess({
        hasAccess: false,
        reason: 'Unable to verify feature access.',
        reasonCode: 'feature_check_failed',
        feature,
        currentPlan: company.subscriptionPlan,
        upgradePath: '/company-management',
      });
    } finally {
      setLoading(false);
    }
  }, [company?.id, company?.subscriptionPlan, feature]);

  useEffect(() => {
    void refresh();
  }, [refresh, company?.subscriptionPlan, company?.subscriptionExpiresAt]);

  return {
    hasAccess: access.hasAccess,
    reason: access.reason,
    reasonCode: access.reasonCode,
    currentPlan: access.currentPlan,
    upgradePath: access.upgradePath,
    loading,
    refresh,
  };
};
