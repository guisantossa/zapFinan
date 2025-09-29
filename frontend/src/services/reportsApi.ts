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

export interface TransactionFilter {
  page?: number;
  size?: number;
  tipo?: 'despesa' | 'receita';
  categoria_id?: number;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
}

export interface Transaction {
  id: string;
  data_transacao: string;
  descricao: string;
  valor: number;
  tipo: 'despesa' | 'receita';
  categoria_id?: number;
  categoria?: {
    id: number;
    nome: string;
    tipo: string;
  };
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface CategorySummary {
  categoria_id: number;
  categoria_nome: string;
  total_valor: number;
  total_transacoes: number;
  tipo: string;
}

export interface BudgetSummary {
  id: string;
  nome: string;
  categoria_id: number;
  categoria_nome: string;
  valor_limite: number;
  valor_gasto: number;
  percentual_gasto: number;
  status: string;
  periodicidade: string;
  dias_restantes: number;
  ativo: boolean;
}

export interface Category {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
}

export interface TransactionStats {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  total_transacoes: number;
}

class ReportsApi {
  // Transaction Reports
  async getTransactions(filters: TransactionFilter = {}): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.size) params.append('size', filters.size.toString());
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.categoria_id) params.append('categoria_id', filters.categoria_id.toString());
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters.data_fim) params.append('data_fim', filters.data_fim);

    const response = await api.get(`/transactions/?${params.toString()}`);
    return response.data;
  }

  async getTransactionStats(data_inicio?: string, data_fim?: string): Promise<TransactionStats> {
    const params = new URLSearchParams();
    if (data_inicio) params.append('data_inicio', data_inicio);
    if (data_fim) params.append('data_fim', data_fim);

    const response = await api.get(`/transactions/stats?${params.toString()}`);
    return response.data;
  }

  async getCategoriesSummary(data_inicio?: string, data_fim?: string): Promise<CategorySummary[]> {
    const params = new URLSearchParams();
    if (data_inicio) params.append('data_inicio', data_inicio);
    if (data_fim) params.append('data_fim', data_fim);

    const response = await api.get(`/transactions/categories-summary?${params.toString()}`);
    return response.data;
  }

  // Budget Reports
  async getBudgetsSummary(usuario_id: string): Promise<BudgetSummary[]> {
    const response = await api.get(`/orcamentos/usuario/${usuario_id}/resumo`);
    return response.data;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categorias/');
    return response.data;
  }

  async getCategoriesByType(tipo: 'despesa' | 'receita'): Promise<Category[]> {
    const response = await api.get(`/categorias/${tipo}`);
    return response.data;
  }

  // Export functionality
  exportToCsv(data: any[], filename: string) {
    if (!data || data.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Format currency
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  // Format percentage
  formatPercentage(value: number): string {
    const safeValue = this.safeNumber(value);
    return `${safeValue.toFixed(1)}%`;
  }

  // Safe number validation
  safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    return num;
  }

  // Safe percentage calculation
  safePercentage(numerator: any, denominator: any): number {
    const num = this.safeNumber(numerator);
    const den = this.safeNumber(denominator);
    if (den === 0) return 0;
    return (num / den) * 100;
  }
}

export const reportsApi = new ReportsApi();