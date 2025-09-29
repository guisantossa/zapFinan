import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { transactionService } from '../services/transactionService';
import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  PaginatedTransactions,
  TransactionListParams
} from '../types/transaction';
import type { LoadingState } from '../types/api';

// Helper function to extract error message safely
const extractErrorMessage = (error: any, defaultMessage: string): string => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    } else if (Array.isArray(detail)) {
      return detail.map(err => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        if (err.message) return err.message;
        return 'Erro de validação';
      }).join(', ');
    } else if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
  }
  return defaultMessage;
};

interface UseTransactionsState {
  transactions: PaginatedTransactions | null;
  loadingState: LoadingState;
  error: string | null;
}

export const useTransactions = (initialParams?: TransactionListParams) => {
  const [state, setState] = useState<UseTransactionsState>({
    transactions: null,
    loadingState: 'idle',
    error: null,
  });

  const [params, setParams] = useState<TransactionListParams>(initialParams || {
    page: 1,
    size: 20,
  });

  // Load transactions
  const loadTransactions = useCallback(async (loadParams?: TransactionListParams) => {
    setState(prev => ({ ...prev, loadingState: 'loading', error: null }));

    try {
      const finalParams = loadParams || params;
      const transactions = await transactionService.list(finalParams);

      setState(prev => ({
        ...prev,
        transactions,
        loadingState: 'succeeded',
      }));
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao carregar transações');
      setState(prev => ({
        ...prev,
        loadingState: 'failed',
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []); // Remove dependency on params to break circular dependency

  // Create transaction
  const createTransaction = useCallback(async (data: TransactionCreate) => {
    try {
      const newTransaction = await transactionService.create(data);
      toast.success('Transação criada com sucesso!');

      // Reload transactions
      await loadTransactions();

      return newTransaction;
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao criar transação');

      toast.error(errorMessage);
      throw error;
    }
  }, [loadTransactions]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, data: TransactionUpdate) => {
    try {
      const updatedTransaction = await transactionService.update(id, data);
      toast.success('Transação atualizada com sucesso!');

      // Reload transactions
      await loadTransactions();

      return updatedTransaction;
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao atualizar transação');

      toast.error(errorMessage);
      throw error;
    }
  }, [loadTransactions]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionService.delete(id);
      toast.success('Transação excluída com sucesso!');

      // Reload transactions
      await loadTransactions();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error, 'Erro ao excluir transação');
      toast.error(errorMessage);
      throw error;
    }
  }, [loadTransactions]);

  // Update params and reload
  const updateParams = useCallback((newParams: Partial<TransactionListParams>) => {
    setParams(prevParams => {
      const updatedParams = { ...prevParams, ...newParams };
      // Use setTimeout to avoid synchronous state updates and potential loops
      setTimeout(() => loadTransactions(updatedParams), 0);
      return updatedParams;
    });
  }, [loadTransactions]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultParams = { page: 1, size: 20 };
    setParams(defaultParams);
    setTimeout(() => loadTransactions(defaultParams), 0);
  }, [loadTransactions]);

  // Load on mount and params change
  useEffect(() => {
    loadTransactions(params);
  }, []); // Only on mount

  return {
    // State
    transactions: state.transactions,
    loading: state.loadingState === 'loading',
    error: state.error,
    params,

    // Actions
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateParams,
    resetFilters,

    // Pagination helpers
    goToPage: (page: number) => updateParams({ page }),
    changePageSize: (size: number) => updateParams({ size, page: 1 }),

    // Filter helpers
    filterByType: (tipo?: "despesa" | "receita") => updateParams({ tipo, page: 1 }),
    filterByCategory: (categoria_id?: number) => updateParams({ categoria_id, page: 1 }),
    filterByDateRange: (data_inicio?: string, data_fim?: string) =>
      updateParams({ data_inicio, data_fim, page: 1 }),
    search: (search?: string) => updateParams({ search, page: 1 }),
  };
};