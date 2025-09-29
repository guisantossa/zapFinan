import { api } from './httpService';
import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionStats,
  CategorySummary,
  PaginatedTransactions,
  TransactionListParams
} from '../types/transaction';

const TRANSACTIONS_BASE_URL = '/transactions';

export const transactionService = {
  // List transactions with filters and pagination
  list: async (params: TransactionListParams = {}): Promise<PaginatedTransactions> => {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.tipo) searchParams.append('tipo', params.tipo);
    if (params.categoria_id) searchParams.append('categoria_id', params.categoria_id.toString());
    if (params.data_inicio) searchParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) searchParams.append('data_fim', params.data_fim);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const url = queryString ? `${TRANSACTIONS_BASE_URL}/?${queryString}` : `${TRANSACTIONS_BASE_URL}/`;

    return api.get<PaginatedTransactions>(url);
  },

  // Get transaction by ID
  getById: async (id: string): Promise<Transaction> => {
    return api.get<Transaction>(`${TRANSACTIONS_BASE_URL}/${id}`);
  },

  // Create new transaction
  create: async (transaction: TransactionCreate): Promise<Transaction> => {
    return api.post<Transaction>(`${TRANSACTIONS_BASE_URL}/`, transaction);
  },

  // Update existing transaction
  update: async (id: string, transaction: TransactionUpdate): Promise<Transaction> => {
    return api.put<Transaction>(`${TRANSACTIONS_BASE_URL}/${id}`, transaction);
  },

  // Delete transaction
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${TRANSACTIONS_BASE_URL}/${id}`);
  },

  // Get transaction statistics
  getStats: async (params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<TransactionStats> => {
    const searchParams = new URLSearchParams();

    if (params?.data_inicio) searchParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) searchParams.append('data_fim', params.data_fim);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${TRANSACTIONS_BASE_URL}/stats?${queryString}`
      : `${TRANSACTIONS_BASE_URL}/stats`;

    return api.get<TransactionStats>(url);
  },

  // Get categories summary
  getCategoriesSummary: async (params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<CategorySummary[]> => {
    const searchParams = new URLSearchParams();

    if (params?.data_inicio) searchParams.append('data_inicio', params.data_inicio);
    if (params?.data_fim) searchParams.append('data_fim', params.data_fim);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${TRANSACTIONS_BASE_URL}/categories-summary?${queryString}`
      : `${TRANSACTIONS_BASE_URL}/categories-summary`;

    return api.get<CategorySummary[]>(url);
  },
};

export default transactionService;