import { Budget, BudgetCreate, BudgetUpdate, BudgetSummary, Category, BudgetStats } from '../types/budget';

const API_BASE = 'http://localhost:8000';

class BudgetAPI {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Listar orçamentos do usuário
  async getBudgets(userId: string, activeOnly: boolean = true): Promise<Budget[]> {
    return this.makeRequest<Budget[]>(
      `/orcamentos/?usuario_id=${userId}&ativo_only=${activeOnly}`
    );
  }

  // Obter resumo dos orçamentos do usuário
  async getBudgetSummaries(userId: string): Promise<BudgetSummary[]> {
    return this.makeRequest<BudgetSummary[]>(
      `/orcamentos/usuario/${userId}/resumo`
    );
  }

  // Obter orçamento específico
  async getBudget(budgetId: string): Promise<Budget> {
    return this.makeRequest<Budget>(`/orcamentos/${budgetId}`);
  }

  // Criar novo orçamento
  async createBudget(budget: BudgetCreate): Promise<Budget> {
    return this.makeRequest<Budget>('/orcamentos/', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  // Atualizar orçamento
  async updateBudget(budgetId: string, budget: BudgetUpdate): Promise<Budget> {
    return this.makeRequest<Budget>(`/orcamentos/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
  }

  // Excluir orçamento
  async deleteBudget(budgetId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/orcamentos/${budgetId}`, {
      method: 'DELETE',
    });
  }

  // Obter resumo de um orçamento específico
  async getBudgetSummary(budgetId: string): Promise<BudgetSummary> {
    return this.makeRequest<BudgetSummary>(`/orcamentos/${budgetId}/resumo`);
  }

  // Listar categorias (assumindo que existe um endpoint)
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>('/categorias/');
  }

  // Calcular estatísticas dos orçamentos
  async getBudgetStats(userId: string): Promise<BudgetStats> {
    const summaries = await this.getBudgetSummaries(userId);

    const stats: BudgetStats = {
      total_budgets: summaries.length,
      active_budgets: summaries.filter(b => b.ativo && b.status === 'ativo').length,
      budgets_near_limit: summaries.filter(b => b.percentual_gasto >= 80 && b.percentual_gasto < 100).length,
      budgets_exceeded: summaries.filter(b => b.percentual_gasto >= 100).length,
      total_allocated: summaries.reduce((sum, b) => {
        const valor = Number(b.valor_limite) || 0;
        return sum + valor;
      }, 0),
      total_spent: summaries.reduce((sum, b) => {
        const valor = Number(b.valor_gasto) || 0;
        return sum + valor;
      }, 0),
    };

    return stats;
  }

  // Verificar alertas de orçamentos
  async getBudgetAlerts(userId: string): Promise<any> {
    return this.makeRequest<any>(`/orcamentos/usuario/${userId}/alertas`);
  }

  // Recalcular orçamentos de um usuário
  async recalculateUserBudgets(userId: string): Promise<any> {
    return this.makeRequest<any>(`/orcamentos/usuario/${userId}/recalcular`, {
      method: 'POST',
    });
  }

  // Recalcular todos os orçamentos (admin)
  async recalculateAllBudgets(): Promise<any> {
    return this.makeRequest<any>(`/sistema/recalcular-orcamentos`, {
      method: 'POST',
    });
  }
}

export const budgetApi = new BudgetAPI();