// Tipos para Dashboard baseados no backend

export interface ResumoFinanceiro {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
}

export interface GastoCategoria {
  categoria: string;
  valor: number;
}

export interface TransacaoRecente {
  id: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  data: string;
  descricao: string;
  usuario_id: string;
}

export interface EvolucaoDiaria {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface DashboardData {
  resumo: ResumoFinanceiro;
  gastos_por_categoria: GastoCategoria[];
  transacoes_recentes: TransacaoRecente[];
  evolucao_diaria: EvolucaoDiaria[];
  mes_referencia: string;
}

export interface PeriodSummary {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  resumo: {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
    quantidade_receitas: number;
    quantidade_despesas: number;
    total_transacoes: number;
  };
}

// Tipos para filtros de período
export interface PeriodFilter {
  label: string;
  value: string;
  data_inicio?: string;
  data_fim?: string;
}

// Tipos para estatísticas do dashboard
export interface DashboardStats {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  crescimento_receitas: number;
  crescimento_despesas: number;
  economia_mes: number;
  media_diaria_gastos: number;
  categoria_maior_gasto: string;
  transacoes_mes: number;
}

// Tipos para comparações
export interface ComparativoPeriodo {
  periodo_atual: ResumoFinanceiro;
  periodo_anterior: ResumoFinanceiro;
  crescimento_receitas: number;
  crescimento_despesas: number;
  crescimento_saldo: number;
}

// Opções de período predefinidas
export const PERIOD_OPTIONS: PeriodFilter[] = [
  {
    label: 'Este Mês',
    value: 'current_month'
  },
  {
    label: 'Mês Passado',
    value: 'last_month'
  },
  {
    label: 'Últimos 3 Meses',
    value: 'last_3_months'
  },
  {
    label: 'Este Ano',
    value: 'current_year'
  },
  {
    label: 'Personalizado',
    value: 'custom'
  }
];

// Cores para diferentes tipos de dados
export const DASHBOARD_COLORS = {
  receitas: '#22c55e', // green-500
  despesas: '#ef4444', // red-500
  saldo: '#3b82f6', // blue-500
  meta: '#8b5cf6', // violet-500
  positivo: '#22c55e',
  negativo: '#ef4444',
  neutro: '#64748b'
} as const;

// Ícones para diferentes categorias (mapeamento)
export const CATEGORY_ICONS: Record<string, string> = {
  'alimentacao': '🍽️',
  'transporte': '🚗',
  'moradia': '🏠',
  'saude': '🏥',
  'educacao': '📚',
  'lazer': '🎮',
  'vestuario': '👕',
  'tecnologia': '💻',
  'outros': '📦',
  'sem categoria': '❓'
};