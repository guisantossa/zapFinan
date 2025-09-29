// Tipos de compromisso
export type CommitmentType = 'reuniao' | 'pagamento' | 'evento' | 'lembrete' | 'aniversario';

// Status do compromisso
export type CommitmentStatus = 'agendado' | 'concluido' | 'cancelado' | 'adiado';

// Tipos de recorrência
export type CommitmentRecurrence = 'nenhuma' | 'diaria' | 'semanal' | 'mensal' | 'anual';

// Interface principal do compromisso
export interface Commitment {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string; // ISO datetime string
  data_fim: string; // ISO datetime string
  tipo: CommitmentType;
  status: CommitmentStatus;
  recorrencia: CommitmentRecurrence;
  recorrencia_ate?: string; // ISO date string
  compromisso_pai_id?: string;

  // Integração Google Calendar
  google_event_id?: string;
  sincronizado_google: boolean;
  ultima_sincronizacao?: string;
  precisa_sincronizar: boolean;

  // Configurações de lembrete
  lembrete_whatsapp: boolean;
  minutos_antes_lembrete: number;

  // Metadados
  criado_em: string;
  atualizado_em: string;
}

// Interface para criação de compromisso
export interface CommitmentCreate {
  usuario_id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  tipo: CommitmentType;
  status?: CommitmentStatus;
  recorrencia?: CommitmentRecurrence;
  recorrencia_ate?: string;
  lembrete_whatsapp?: boolean;
  minutos_antes_lembrete?: number;
}

// Interface para atualização de compromisso
export interface CommitmentUpdate {
  titulo?: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  tipo?: CommitmentType;
  status?: CommitmentStatus;
  recorrencia?: CommitmentRecurrence;
  recorrencia_ate?: string;
  lembrete_whatsapp?: boolean;
  minutos_antes_lembrete?: number;
}

// Interface para resumo/summary do compromisso
export interface CommitmentSummary {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  tipo: CommitmentType;
  status: CommitmentStatus;
  dias_restantes: number;
  vencido: boolean;
}

// Estatísticas dos compromissos
export interface CommitmentStats {
  total_compromissos: number;
  compromissos_hoje: number;
  compromissos_semana: number;
  compromissos_vencidos: number;
  compromissos_concluidos: number;
  compromissos_agendados: number;
  compromissos_por_tipo: {
    reuniao: number;
    pagamento: number;
    evento: number;
    lembrete: number;
    aniversario: number;
  };
}

// Resposta da agenda (vista de calendário)
export interface AgendaResponse {
  data: string; // ISO date string
  compromissos: CommitmentSummary[];
  total_dia: number;
}

// Status de autenticação Google
export interface GoogleAuthStatus {
  ativo: boolean;
  google_email?: string;
  ultima_sincronizacao?: string;
  url_autenticacao?: string;
}

// Filtros para compromissos
export interface CommitmentFilters {
  tipo?: CommitmentType;
  status?: CommitmentStatus;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}

// Opções para recorrência
export interface RecurrenceOptions {
  value: CommitmentRecurrence;
  label: string;
}

// Opções para tipos
export interface TypeOptions {
  value: CommitmentType;
  label: string;
  icon: string;
  color: string;
}

// Constantes para UI
export const COMMITMENT_TYPES: TypeOptions[] = [
  { value: 'reuniao', label: 'Reunião', icon: '👥', color: 'blue' },
  { value: 'pagamento', label: 'Pagamento', icon: '💳', color: 'green' },
  { value: 'evento', label: 'Evento', icon: '🎉', color: 'purple' },
  { value: 'lembrete', label: 'Lembrete', icon: '⏰', color: 'yellow' },
  { value: 'aniversario', label: 'Aniversário', icon: '🎂', color: 'pink' }
];

export const COMMITMENT_STATUS = [
  { value: 'agendado', label: 'Agendado', color: 'blue' },
  { value: 'concluido', label: 'Concluído', color: 'green' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' },
  { value: 'adiado', label: 'Adiado', color: 'yellow' }
];

export const RECURRENCE_OPTIONS: RecurrenceOptions[] = [
  { value: 'nenhuma', label: 'Não repetir' },
  { value: 'diaria', label: 'Diariamente' },
  { value: 'semanal', label: 'Semanalmente' },
  { value: 'mensal', label: 'Mensalmente' },
  { value: 'anual', label: 'Anualmente' }
];