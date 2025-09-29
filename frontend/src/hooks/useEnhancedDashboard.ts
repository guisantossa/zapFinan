import { useState, useEffect, useCallback } from 'react';
import { useDashboard } from './useDashboard';
import { budgetApi } from '../services/budgetApi';
import { commitmentApi } from '../services/commitmentApi';
import { useAuth } from '../contexts/AuthContext';
import { Budget } from '../types/budget';
import { Commitment } from '../types/commitment';

interface EnhancedStats {
  // Budget stats
  totalBudgets: number;
  budgetsOnTrack: number;
  budgetsWarning: number;
  budgetsExceeded: number;
  budgetEfficiency: number;

  // Commitment stats
  upcomingCommitments: number;
  urgentCommitments: number;
  completedThisMonth: number;

  // Financial insights
  savingsRate: number;
  spendingVelocity: number;
  categoryDiversification: number;
  financialHealth: 'excellent' | 'good' | 'fair' | 'poor';

  // Trends
  weeklyTrend: number;
  monthlyTrend: number;
  topSpendingCategory: string;
  biggestBudgetConcern: string;
}

interface UseEnhancedDashboardReturn {
  // Original dashboard data
  data: any;
  stats: any;
  comparativo: any;
  isLoading: boolean;
  error: string | null;

  // Enhanced data
  enhancedStats: EnhancedStats | null;
  budgets: Budget[];
  upcomingCommitments: Commitment[];

  // Loading states
  isBudgetsLoading: boolean;
  isCommitmentsLoading: boolean;

  // Error states
  budgetsError: string | null;
  commitmentsError: string | null;

  // Actions
  refreshAll: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshCommitments: () => Promise<void>;

  // Current period
  currentPeriod: any;
  customDates: any;
  setPeriod: (period: string) => void;
  setCustomPeriod: (dataInicio: string, dataFim: string) => void;
}

export function useEnhancedDashboard(): UseEnhancedDashboardReturn {
  const { user } = useAuth();
  const dashboardHook = useDashboard({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minuto
  });

  // Additional state
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStats | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [upcomingCommitments, setUpcomingCommitments] = useState<Commitment[]>([]);

  const [isBudgetsLoading, setIsBudgetsLoading] = useState(false);
  const [isCommitmentsLoading, setIsCommitmentsLoading] = useState(false);

  const [budgetsError, setBudgetsError] = useState<string | null>(null);
  const [commitmentsError, setCommitmentsError] = useState<string | null>(null);

  // Load budgets
  const refreshBudgets = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsBudgetsLoading(true);
      setBudgetsError(null);
      const budgetsData = await budgetApi.getBudgets(user.id);
      setBudgets(budgetsData);
    } catch (err: any) {
      console.error('Error loading budgets:', err);
      setBudgetsError(err.message || 'Erro ao carregar orçamentos');
    } finally {
      setIsBudgetsLoading(false);
    }
  }, [user?.id]);

  // Load commitments
  const refreshCommitments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsCommitmentsLoading(true);
      setCommitmentsError(null);

      const allCommitments = await commitmentApi.getCommitments(user.id);

      // Filter for upcoming commitments (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = allCommitments.filter((commitment: Commitment) => {
        const startDate = new Date(commitment.data_inicio);
        return startDate >= now && startDate <= nextWeek && commitment.status === 'agendado';
      });

      setUpcomingCommitments(upcoming);
    } catch (err: any) {
      console.error('Error loading commitments:', err);
      setCommitmentsError(err.message || 'Erro ao carregar compromissos');
    } finally {
      setIsCommitmentsLoading(false);
    }
  }, [user?.id]);

  // Calculate enhanced statistics
  const calculateEnhancedStats = useCallback(() => {
    if (!dashboardHook.data || !budgets) return;

    const { data, comparativo } = dashboardHook;

    // Budget statistics
    const totalBudgets = budgets.length;
    let budgetsOnTrack = 0;
    let budgetsWarning = 0;
    let budgetsExceeded = 0;
    let totalBudgetEfficiency = 0;

    budgets.forEach((budget: Budget) => {
      const percentage = budget.valor_limite > 0 ? (budget.valor_gasto / budget.valor_limite) * 100 : 0;

      if (percentage >= 100) budgetsExceeded++;
      else if (percentage >= 80) budgetsWarning++;
      else budgetsOnTrack++;

      // Calculate efficiency (lower percentage = higher efficiency)
      const efficiency = Math.max(0, 100 - percentage);
      totalBudgetEfficiency += efficiency;
    });

    const budgetEfficiency = totalBudgets > 0 ? totalBudgetEfficiency / totalBudgets : 0;

    // Commitment statistics
    const upcomingCount = upcomingCommitments.length;
    const urgentCount = upcomingCommitments.filter(c => {
      const startDate = new Date(c.data_inicio);
      const now = new Date();
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 1;
    }).length;

    // Count completed commitments this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = 0; // Would need to fetch all commitments to calculate this

    // Financial insights
    const totalIncome = data.resumo.total_receitas;
    const totalExpenses = data.resumo.total_despesas;

    // Savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Spending velocity (average daily spending)
    const daysInPeriod = data.evolucao_diaria.length;
    const spendingVelocity = daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0;

    // Category diversification (how spread out spending is)
    const categories = data.gastos_por_categoria;
    const categoryDiversification = categories.length > 0 ?
      100 - ((categories[0]?.valor || 0) / totalExpenses * 100) : 0;

    // Financial health score
    let healthScore = 0;
    if (savingsRate > 20) healthScore += 30;
    else if (savingsRate > 10) healthScore += 20;
    else if (savingsRate > 0) healthScore += 10;

    if (budgetEfficiency > 80) healthScore += 25;
    else if (budgetEfficiency > 60) healthScore += 15;
    else if (budgetEfficiency > 40) healthScore += 10;

    if (budgetsExceeded === 0) healthScore += 20;
    else if (budgetsExceeded <= 1) healthScore += 10;

    if (categoryDiversification > 60) healthScore += 15;
    else if (categoryDiversification > 40) healthScore += 10;

    if (totalExpenses > 0 && totalIncome > totalExpenses) healthScore += 10;

    const financialHealth: 'excellent' | 'good' | 'fair' | 'poor' =
      healthScore >= 80 ? 'excellent' :
      healthScore >= 60 ? 'good' :
      healthScore >= 40 ? 'fair' : 'poor';

    // Trends
    const weeklyTrend = comparativo?.crescimento_despesas || 0;
    const monthlyTrend = comparativo?.crescimento_saldo || 0;

    // Top spending category
    const topSpendingCategory = categories.length > 0 ? categories[0].categoria : 'Nenhuma';

    // Biggest budget concern
    const worstBudget = budgets
      .map((budget: Budget) => ({
        ...budget,
        percentage: budget.valor_limite > 0 ? (budget.valor_gasto / budget.valor_limite) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)[0];

    const biggestBudgetConcern = worstBudget?.nome || 'Nenhum';

    setEnhancedStats({
      totalBudgets,
      budgetsOnTrack,
      budgetsWarning,
      budgetsExceeded,
      budgetEfficiency: Math.round(budgetEfficiency),
      upcomingCommitments: upcomingCount,
      urgentCommitments: urgentCount,
      completedThisMonth,
      savingsRate: Math.round(savingsRate),
      spendingVelocity: Math.round(spendingVelocity),
      categoryDiversification: Math.round(categoryDiversification),
      financialHealth,
      weeklyTrend: Math.round(weeklyTrend),
      monthlyTrend: Math.round(monthlyTrend),
      topSpendingCategory,
      biggestBudgetConcern
    });
  }, [dashboardHook.data, dashboardHook.comparativo, budgets, upcomingCommitments]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      dashboardHook.refreshAll(),
      refreshBudgets(),
      refreshCommitments()
    ]);
  }, [dashboardHook.refreshAll, refreshBudgets, refreshCommitments]);

  // Load additional data when user changes
  useEffect(() => {
    if (user?.id) {
      refreshBudgets();
      refreshCommitments();
    }
  }, [user?.id, refreshBudgets, refreshCommitments]);

  // Recalculate enhanced stats when data changes
  useEffect(() => {
    calculateEnhancedStats();
  }, [calculateEnhancedStats]);

  return {
    // Original dashboard data
    data: dashboardHook.data,
    stats: dashboardHook.stats,
    comparativo: dashboardHook.comparativo,
    isLoading: dashboardHook.isLoading,
    error: dashboardHook.error,

    // Enhanced data
    enhancedStats,
    budgets,
    upcomingCommitments,

    // Loading states
    isBudgetsLoading,
    isCommitmentsLoading,

    // Error states
    budgetsError,
    commitmentsError,

    // Actions
    refreshAll,
    refreshBudgets,
    refreshCommitments,

    // Current period
    currentPeriod: dashboardHook.currentPeriod,
    customDates: dashboardHook.customDates,
    setPeriod: dashboardHook.setPeriod,
    setCustomPeriod: dashboardHook.setCustomPeriod
  };
}