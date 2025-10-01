import axios from 'axios';

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PlanFeatures {
  transactions_enabled: boolean;
  budgets_enabled: boolean;
  commitments_enabled: boolean;
  reports_advanced: boolean;
  google_calendar_sync: boolean;
  multi_phone_enabled: boolean;
  api_access: boolean;
  priority_support: boolean;
}

export interface PlanLimits {
  max_transactions_per_month: number | null;
  max_budgets: number | null;
  max_commitments: number | null;
  max_categories: number | null;
  max_phones: number | null;
  data_retention_months: number;
}

export interface Plan {
  id: number;
  nome: string;
  valor_mensal: number;
  valor_anual: number;
  description?: string;
  color?: string;
}

export interface PlanWithFeatures extends Plan, PlanFeatures, PlanLimits {}

export interface PlanResponse extends PlanWithFeatures {
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  features_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlanCreate {
  nome: string;
  valor_mensal: number;
  valor_anual: number;
  description?: string;
  color?: string;
  transactions_enabled: boolean;
  budgets_enabled: boolean;
  commitments_enabled: boolean;
  reports_advanced: boolean;
  google_calendar_sync: boolean;
  multi_phone_enabled: boolean;
  api_access: boolean;
  priority_support: boolean;
  max_transactions_per_month: number | null;
  max_budgets: number | null;
  max_commitments: number | null;
  max_categories: number | null;
  max_phones: number | null;
  data_retention_months: number;
  is_active: boolean;
  is_default: boolean;
  display_order?: number;
  features_json?: Record<string, any>;
}

export interface PlanUpdate {
  nome?: string;
  valor_mensal?: number;
  valor_anual?: number;
  description?: string;
  color?: string;
  transactions_enabled?: boolean;
  budgets_enabled?: boolean;
  commitments_enabled?: boolean;
  reports_advanced?: boolean;
  google_calendar_sync?: boolean;
  multi_phone_enabled?: boolean;
  api_access?: boolean;
  priority_support?: boolean;
  max_transactions_per_month?: number | null;
  max_budgets?: number | null;
  max_commitments?: number | null;
  max_categories?: number | null;
  max_phones?: number | null;
  data_retention_months?: number;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
  features_json?: Record<string, any>;
}

export interface UsageSummary {
  has_plan: boolean;
  plan_id?: number;
  plan_name?: string;
  usage: {
    transactions_this_month: number;
    total_transactions: number;
    budgets: number;
    commitments: number;
    categories: number;
    phones: number;
  };
  limits: PlanLimits;
  percentages: Record<string, number>;
  warnings: string[];
  features: PlanFeatures;
}

export interface CanCreateResponse {
  can_create: boolean;
  message: string | null;
}

export interface FeaturesResponse {
  has_plan: boolean;
  plan_id?: number;
  plan_name?: string;
  features: PlanFeatures;
}

// ============================================================================
// Plans API Class
// ============================================================================

class PlansApi {
  // ========================================================================
  // Public Endpoints (Users)
  // ========================================================================

  async getActivePlans(): Promise<PlanWithFeatures[]> {
    const response = await api.get('/plans/');
    return response.data;
  }

  async getPlan(planId: number): Promise<PlanWithFeatures> {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  }

  // ========================================================================
  // Admin Endpoints
  // ========================================================================

  async adminGetAllPlans(includeInactive: boolean = false): Promise<PlanResponse[]> {
    const response = await api.get('/plans/admin/all', {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  }

  async adminCreatePlan(planData: PlanCreate): Promise<PlanResponse> {
    const response = await api.post('/plans/admin/', planData);
    return response.data;
  }

  async adminUpdatePlan(planId: number, planData: PlanUpdate): Promise<PlanResponse> {
    const response = await api.put(`/plans/admin/${planId}`, planData);
    return response.data;
  }

  async adminActivatePlan(planId: number): Promise<PlanResponse> {
    const response = await api.patch(`/plans/admin/${planId}/activate`);
    return response.data;
  }

  async adminDeactivatePlan(planId: number): Promise<PlanResponse> {
    const response = await api.patch(`/plans/admin/${planId}/deactivate`);
    return response.data;
  }

  async adminSetDefaultPlan(planId: number): Promise<PlanResponse> {
    const response = await api.patch(`/plans/admin/${planId}/set-default`);
    return response.data;
  }

  async adminDeletePlan(planId: number): Promise<void> {
    await api.delete(`/plans/admin/${planId}`);
  }

  // ========================================================================
  // Usage Endpoints
  // ========================================================================

  async getUsageSummary(): Promise<UsageSummary> {
    const response = await api.get('/usage/summary');
    return response.data;
  }

  async checkCanCreate(resourceType: string): Promise<CanCreateResponse> {
    const response = await api.get(`/usage/check/${resourceType}`);
    return response.data;
  }

  async getPlanFeatures(): Promise<FeaturesResponse> {
    const response = await api.get('/usage/features');
    return response.data;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  calculateAnnualSavings(plan: Plan): { savings: number; percentage: number } {
    const monthlyTotal = plan.valor_mensal * 12;
    const savings = monthlyTotal - plan.valor_anual;
    const percentage = (savings / monthlyTotal) * 100;
    return { savings, percentage };
  }

  getLimitDisplay(limit: number | null): string {
    return limit === null ? 'Ilimitado' : limit.toString();
  }

  getUsagePercentage(current: number, limit: number | null): number {
    if (limit === null) return 0; // Unlimited
    if (limit === 0) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  }

  getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getPlanColor(color?: string): string {
    const colorMap: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
    };
    return colorMap[color || 'blue'] || colorMap.blue;
  }
}

export const plansApi = new PlansApi();