import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { transactionService } from '../services/transactionService';
import type { TransactionStats, CategorySummary } from '../types/transaction';
import type { LoadingState } from '../types/api';

interface UseTransactionStatsState {
  stats: TransactionStats | null;
  categoriesSummary: CategorySummary[] | null;
  loadingState: LoadingState;
  error: string | null;
}

interface StatsParams {
  data_inicio?: string;
  data_fim?: string;
}

export const useTransactionStats = (initialParams?: StatsParams) => {
  const [state, setState] = useState<UseTransactionStatsState>({
    stats: null,
    categoriesSummary: null,
    loadingState: 'idle',
    error: null,
  });

  const [params, setParams] = useState<StatsParams>(initialParams || {});

  // Load stats and categories summary
  const loadStats = useCallback(async (loadParams?: StatsParams) => {
    setState(prev => ({ ...prev, loadingState: 'loading', error: null }));

    try {
      const finalParams = loadParams || params;

      // Load both stats and categories summary in parallel
      const [stats, categoriesSummary] = await Promise.all([
        transactionService.getStats(finalParams),
        transactionService.getCategoriesSummary(finalParams),
      ]);

      setState(prev => ({
        ...prev,
        stats,
        categoriesSummary,
        loadingState: 'succeeded',
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar estatísticas';
      setState(prev => ({
        ...prev,
        loadingState: 'failed',
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []); // Remove dependency on params to break circular dependency

  // Update params and reload
  const updateParams = useCallback((newParams: Partial<StatsParams>) => {
    setParams(prevParams => {
      const updatedParams = { ...prevParams, ...newParams };
      // Use setTimeout to avoid synchronous state updates and potential loops
      setTimeout(() => loadStats(updatedParams), 0);
      return updatedParams;
    });
  }, [loadStats]);

  // Set date range
  const setDateRange = useCallback((data_inicio?: string, data_fim?: string) => {
    updateParams({ data_inicio, data_fim });
  }, [updateParams]);

  // Clear date filters
  const clearDateFilters = useCallback(() => {
    updateParams({ data_inicio: undefined, data_fim: undefined });
  }, [updateParams]);

  // Load on mount
  useEffect(() => {
    loadStats();
  }, []); // Only on mount

  // Helper computed values
  const totalTransactions = state.stats ? state.stats.receitas + state.stats.despesas : 0;
  const hasPositiveBalance = state.stats ? state.stats.saldo > 0 : false;
  const hasNegativeBalance = state.stats ? state.stats.saldo < 0 : false;

  // Format currency helper
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  // Get stats with formatted values
  const formattedStats = state.stats ? {
    ...state.stats,
    total_receitas_formatted: formatCurrency(state.stats.total_receitas),
    total_despesas_formatted: formatCurrency(state.stats.total_despesas),
    saldo_formatted: formatCurrency(state.stats.saldo),
  } : null;

  // Get categories summary with formatted values
  const formattedCategoriesSummary = state.categoriesSummary?.map(category => ({
    ...category,
    total_formatted: formatCurrency(category.total),
  })) || null;

  return {
    // State
    stats: formattedStats,
    categoriesSummary: formattedCategoriesSummary,
    loading: state.loadingState === 'loading',
    error: state.error,
    params,

    // Actions
    loadStats,
    updateParams,
    setDateRange,
    clearDateFilters,

    // Computed values
    totalTransactions,
    hasPositiveBalance,
    hasNegativeBalance,

    // Helpers
    formatCurrency,
  };
};