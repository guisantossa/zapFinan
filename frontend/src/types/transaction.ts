export interface Category {
  id: number;
  nome: string;
  tipo: string;
  cor?: string;
  icone?: string;
}

export interface BudgetAlertInfo {
  tipo_alerta: "aviso" | "estouro";
  budget_id: string;
  budget_nome: string;
  categoria_id: number;
  categoria_nome: string;
  valor_limite: number;
  valor_gasto: number;
  valor_disponivel: number;
  percentual_gasto: number;
  percentual_notificacao: number;
  periodo_info: {
    ano: number;
    mes: number;
    quinzena?: number;
    semana?: number;
    data_inicio: string;
    data_fim: string;
    periodicidade: string;
  };
  alerta_enviado: boolean;
}

export interface Transaction {
  id: string;
  usuario_id: string;
  mensagem_original: string;
  valor: number;
  descricao: string;
  tipo: "despesa" | "receita";
  canal?: "audioMessage" | "conversation" | "imageMessage" | "webApp";
  categoria_id?: number;
  data_transacao: string; // ISO date string
  data_registro: string; // ISO datetime string
  categoria?: Category;
  budget_alert?: BudgetAlertInfo;
}

export interface TransactionCreate {
  mensagem_original: string;
  valor: number;
  descricao: string;
  tipo: "despesa" | "receita";
  canal?: "audioMessage" | "conversation" | "imageMessage";
  categoria_id?: number;
  data_transacao?: string; // ISO date string
}

export interface TransactionUpdate {
  descricao?: string;
  valor?: number;
  categoria_id?: number;
  data_transacao?: string; // ISO date string
}

export interface TransactionFilters {
  tipo?: "despesa" | "receita";
  categoria_id?: number;
  data_inicio?: string; // ISO date string
  data_fim?: string; // ISO date string
  valor_min?: number;
  valor_max?: number;
  search?: string; // Search in description
}

export interface TransactionStats {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  receitas: number; // count
  despesas: number; // count
}

export interface CategorySummary {
  categoria: string;
  tipo: string;
  total: number;
  quantidade: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TransactionListParams {
  page?: number;
  size?: number;
  tipo?: "despesa" | "receita";
  categoria_id?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}