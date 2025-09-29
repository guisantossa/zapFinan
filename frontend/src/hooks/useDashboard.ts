import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardData,
  DashboardStats,
  ComparativoPeriodo,
  PeriodFilter,
  PERIOD_OPTIONS
} from '../types/dashboard';

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialPeriod?: string;
}

interface UseDashboardReturn {
  // Data
  data: DashboardData | null;
  stats: DashboardStats | null;
  comparativo: ComparativoPeriodo | null;

  // Loading states
  isLoading: boolean;
  isStatsLoading: boolean;
  isComparativoLoading: boolean;

  // Error states
  error: string | null;
  statsError: string | null;
  comparativoError: string | null;

  // Current period
  currentPeriod: PeriodFilter;
  customDates: { data_inicio: string; data_fim: string } | null;

  // Actions
  loadData: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadComparativo: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setPeriod: (period: string) => void;
  setCustomPeriod: (dataInicio: string, dataFim: string) => void;
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { user } = useAuth();
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
    initialPeriod = 'current_month'
  } = options;

  // State
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [comparativo, setComparativo] = useState<ComparativoPeriodo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isComparativoLoading, setIsComparativoLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [comparativoError, setComparativoError] = useState<string | null>(null);

  const [currentPeriod, setCurrentPeriod] = useState<PeriodFilter>(
    PERIOD_OPTIONS.find(p => p.value === initialPeriod) || PERIOD_OPTIONS[0]
  );
  const [customDates, setCustomDates] = useState<{ data_inicio: string; data_fim: string } | null>(null);

  // Get current period dates
  const getCurrentDates = useCallback(() => {
    if (currentPeriod.value === 'custom' && customDates) {
      return customDates;
    }
    return dashboardApi.getPeriodDates(currentPeriod.value);
  }, [currentPeriod, customDates]);

  // Load dashboard data
  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const dates = getCurrentDates();
      const dashboardData = await dashboardApi.getDashboardData(
        user.id,
        dates.data_inicio,
        dates.data_fim
      );

      setData(dashboardData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getCurrentDates]);

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsStatsLoading(true);
      setStatsError(null);

      const dates = getCurrentDates();
      const statsData = await dashboardApi.calculateDashboardStats(
        user.id,
        dates.data_inicio,
        dates.data_fim
      );

      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setStatsError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setIsStatsLoading(false);
    }
  }, [user?.id, getCurrentDates]);

  // Load comparative data
  const loadComparativo = useCallback(async () => {
    if (!user?.id || currentPeriod.value === 'custom') return;

    try {
      setIsComparativoLoading(true);
      setComparativoError(null);

      const dates = getCurrentDates();
      const previousDates = dashboardApi.getPreviousPeriod(dates.data_inicio, dates.data_fim);

      const comparativoData = await dashboardApi.getComparativoPeriodo(
        user.id,
        dates,
        previousDates
      );

      setComparativo(comparativoData);
    } catch (err: any) {
      console.error('Error loading comparative data:', err);
      setComparativoError(err.message || 'Erro ao carregar comparativo');
    } finally {
      setIsComparativoLoading(false);
    }
  }, [user?.id, getCurrentDates, currentPeriod.value]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadData(),
      loadStats(),
      loadComparativo()
    ]);
  }, [loadData, loadStats, loadComparativo]);

  // Set period
  const setPeriod = useCallback((period: string) => {
    const periodOption = PERIOD_OPTIONS.find(p => p.value === period);
    if (periodOption) {
      setCurrentPeriod(periodOption);
      if (period !== 'custom') {
        setCustomDates(null);
      }
    }
  }, []);

  // Set custom period
  const setCustomPeriod = useCallback((dataInicio: string, dataFim: string) => {
    setCustomDates({ data_inicio: dataInicio, data_fim: dataFim });
    const customOption = PERIOD_OPTIONS.find(p => p.value === 'custom');
    if (customOption) {
      setCurrentPeriod(customOption);
    }
  }, []);

  // Load data when user or period changes
  useEffect(() => {
    if (user?.id) {
      refreshAll();
    }
  }, [user?.id, currentPeriod, customDates]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user?.id, refreshAll]);

  return {
    // Data
    data,
    stats,
    comparativo,

    // Loading states
    isLoading,
    isStatsLoading,
    isComparativoLoading,

    // Error states
    error,
    statsError,
    comparativoError,

    // Current period
    currentPeriod,
    customDates,

    // Actions
    loadData,
    loadStats,
    loadComparativo,
    refreshAll,
    setPeriod,
    setCustomPeriod
  };
}

// Hook simplificado para casos básicos
export function useBasicDashboard() {
  return useDashboard({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minuto
  });
}