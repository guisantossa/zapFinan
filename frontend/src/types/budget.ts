export interface Budget {
  id: string;
  nome: string;
  categoria_id: number;
  categoria_nome?: string;
  valor_limite: number;
  valor_gasto: number;
  percentual_gasto: number;
  status: 'ativo' | 'excedido' | 'finalizado';
  periodicidade: 'mensal' | 'quinzenal' | 'semanal';
  dias_restantes?: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface BudgetCreate {
  nome: string;
  categoria_id: number;
  valor_limite: number;
  periodicidade: 'mensal' | 'quinzenal' | 'semanal';
  notificar_em?: number;
  usuario_id: string;
}

export interface BudgetUpdate {
  nome?: string;
  valor_limite?: number;
  periodicidade?: 'mensal' | 'quinzenal' | 'semanal';
  notificar_em?: number;
  ativo?: boolean;
}

export interface BudgetSummary {
  id: string;
  nome: string;
  categoria_id: number;
  categoria_nome?: string;
  valor_limite: number;
  valor_gasto: number;
  percentual_gasto: number;
  status: string;
  periodicidade: string;
  dias_restantes?: number;
  ativo: boolean;
}

export interface Category {
  id: number;
  nome: string;
  tipo: 'despesa' | 'receita';
}

export interface BudgetStats {
  total_budgets: number;
  active_budgets: number;
  budgets_near_limit: number;
  total_allocated: number;
  total_spent: number;
  budgets_exceeded: number;
}