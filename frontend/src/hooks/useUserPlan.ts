import { useAuth } from '../contexts/AuthContext';
import { UserPlan } from '../types/auth';

export interface PlanFeatures {
  transactions: boolean;
  budgets: boolean;
  commitments: boolean;
  reports: boolean;
  googleCalendar: boolean;
  multiPhone: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export function useUserPlan() {
  const { user } = useAuth();

  const plan: UserPlan | null = user?.plano || null;

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!plan) return false;

    const featureMap: Record<keyof PlanFeatures, keyof UserPlan> = {
      transactions: 'transactions_enabled',
      budgets: 'budgets_enabled',
      commitments: 'commitments_enabled',
      reports: 'reports_advanced',
      googleCalendar: 'google_calendar_sync',
      multiPhone: 'multi_phone_enabled',
      apiAccess: 'api_access',
      prioritySupport: 'priority_support',
    };

    const planFeature = featureMap[feature];
    return Boolean(plan[planFeature]);
  };

  const getLimit = (limit: 'transactions' | 'budgets' | 'commitments' | 'phones'): number | null => {
    if (!plan) return null;

    const limitMap = {
      transactions: plan.max_transactions_per_month,
      budgets: plan.max_budgets,
      commitments: plan.max_commitments,
      phones: plan.max_phones,
    };

    return limitMap[limit];
  };

  const features: PlanFeatures = {
    transactions: hasFeature('transactions'),
    budgets: hasFeature('budgets'),
    commitments: hasFeature('commitments'),
    reports: hasFeature('reports'),
    googleCalendar: hasFeature('googleCalendar'),
    multiPhone: hasFeature('multiPhone'),
    apiAccess: hasFeature('apiAccess'),
    prioritySupport: hasFeature('prioritySupport'),
  };

  return {
    plan,
    features,
    hasFeature,
    getLimit,
    hasPlan: Boolean(plan),
  };
}
