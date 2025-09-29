import { useState, useCallback, useMemo } from 'react';
import type { TransactionFilters } from '../types/transaction';

export const useTransactionFilters = (initialFilters?: TransactionFilters) => {
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters || {});

  // Update a specific filter
  const updateFilter = useCallback(<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof TransactionFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Set type filter
  const setType = useCallback((tipo?: "despesa" | "receita") => {
    updateFilter('tipo', tipo);
  }, [updateFilter]);

  // Set category filter
  const setCategory = useCallback((categoria_id?: number) => {
    updateFilter('categoria_id', categoria_id);
  }, [updateFilter]);

  // Set date range
  const setDateRange = useCallback((data_inicio?: string, data_fim?: string) => {
    updateFilters({ data_inicio, data_fim });
  }, [updateFilters]);

  // Set amount range
  const setAmountRange = useCallback((valor_min?: number, valor_max?: number) => {
    updateFilters({ valor_min, valor_max });
  }, [updateFilters]);

  // Set search query
  const setSearch = useCallback((search?: string) => {
    updateFilter('search', search);
  }, [updateFilter]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof TransactionFilters];
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof TransactionFilters];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  // Get filter labels for display
  const getFilterLabels = useCallback(() => {
    const labels: string[] = [];

    if (filters.tipo) {
      labels.push(filters.tipo === 'receita' ? 'Receitas' : 'Despesas');
    }

    if (filters.categoria_id) {
      labels.push(`Categoria: ${filters.categoria_id}`);
    }

    if (filters.data_inicio || filters.data_fim) {
      if (filters.data_inicio && filters.data_fim) {
        labels.push(`Período: ${filters.data_inicio} - ${filters.data_fim}`);
      } else if (filters.data_inicio) {
        labels.push(`A partir de: ${filters.data_inicio}`);
      } else if (filters.data_fim) {
        labels.push(`Até: ${filters.data_fim}`);
      }
    }

    if (filters.valor_min || filters.valor_max) {
      if (filters.valor_min && filters.valor_max) {
        labels.push(`Valor: R$ ${filters.valor_min} - R$ ${filters.valor_max}`);
      } else if (filters.valor_min) {
        labels.push(`Valor mínimo: R$ ${filters.valor_min}`);
      } else if (filters.valor_max) {
        labels.push(`Valor máximo: R$ ${filters.valor_max}`);
      }
    }

    if (filters.search) {
      labels.push(`Busca: "${filters.search}"`);
    }

    return labels;
  }, [filters]);

  // Preset filter combinations
  const setThisMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }, [setDateRange]);

  const setLastMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    setDateRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }, [setDateRange]);

  const setThisYear = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);

    setDateRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }, [setDateRange]);

  return {
    // State
    filters,
    hasActiveFilters,
    activeFiltersCount,

    // Actions
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,

    // Specific filter setters
    setType,
    setCategory,
    setDateRange,
    setAmountRange,
    setSearch,

    // Preset combinations
    setThisMonth,
    setLastMonth,
    setThisYear,

    // Helpers
    getFilterLabels,
  };
};