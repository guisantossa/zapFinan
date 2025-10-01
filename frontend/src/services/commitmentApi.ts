import {
  Commitment,
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentSummary,
  CommitmentStats,
  AgendaResponse,
  GoogleAuthStatus,
  CommitmentFilters
} from '../types/commitment';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class CommitmentAPI {
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

  // Listar compromissos do usuário
  async getCommitments(
    userId: string,
    filters?: CommitmentFilters,
    skip: number = 0,
    limit: number = 100
  ): Promise<Commitment[]> {
    const params = new URLSearchParams({
      usuario_id: userId,
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.data_inicio) params.append('data_inicio', filters.data_inicio);
    if (filters?.data_fim) params.append('data_fim', filters.data_fim);
    if (filters?.busca) params.append('busca', filters.busca);

    return this.makeRequest<Commitment[]>(`/compromissos/?${params}`);
  }

  // Obter compromisso específico
  async getCommitment(commitmentId: string): Promise<Commitment> {
    return this.makeRequest<Commitment>(`/compromissos/${commitmentId}`);
  }

  // Criar novo compromisso
  async createCommitment(commitment: CommitmentCreate): Promise<Commitment> {
    return this.makeRequest<Commitment>('/compromissos/', {
      method: 'POST',
      body: JSON.stringify(commitment),
    });
  }

  // Atualizar compromisso
  async updateCommitment(commitmentId: string, commitment: CommitmentUpdate): Promise<Commitment> {
    return this.makeRequest<Commitment>(`/compromissos/${commitmentId}`, {
      method: 'PUT',
      body: JSON.stringify(commitment),
    });
  }

  // Excluir compromisso
  async deleteCommitment(commitmentId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/compromissos/${commitmentId}`, {
      method: 'DELETE',
    });
  }

  // Obter agenda do usuário (vista de calendário)
  async getUserAgenda(
    userId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<AgendaResponse[]> {
    const params = new URLSearchParams({
      usuario_id: userId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    });

    return this.makeRequest<AgendaResponse[]>(`/compromissos/agenda/?${params}`);
  }

  // Obter compromissos de hoje
  async getTodayCommitments(userId: string): Promise<CommitmentSummary[]> {
    return this.makeRequest<CommitmentSummary[]>(`/compromissos/usuario/${userId}/hoje`);
  }

  // Obter compromissos da semana
  async getWeekCommitments(userId: string): Promise<CommitmentSummary[]> {
    return this.makeRequest<CommitmentSummary[]>(`/compromissos/usuario/${userId}/semana`);
  }

  // Obter compromissos vencidos
  async getOverdueCommitments(userId: string): Promise<CommitmentSummary[]> {
    return this.makeRequest<CommitmentSummary[]>(`/compromissos/usuario/${userId}/vencidos`);
  }

  // Marcar compromisso como concluído
  async markAsCompleted(commitmentId: string): Promise<Commitment> {
    return this.makeRequest<Commitment>(`/compromissos/${commitmentId}/concluir`, {
      method: 'PATCH',
    });
  }

  // Marcar compromisso como cancelado
  async markAsCancelled(commitmentId: string): Promise<Commitment> {
    return this.makeRequest<Commitment>(`/compromissos/${commitmentId}/cancelar`, {
      method: 'PATCH',
    });
  }

  // Adiar compromisso
  async postponeCommitment(
    commitmentId: string,
    novaDataInicio: string,
    novaDataFim: string
  ): Promise<Commitment> {
    return this.makeRequest<Commitment>(`/compromissos/${commitmentId}/adiar`, {
      method: 'PATCH',
      body: JSON.stringify({
        nova_data_inicio: novaDataInicio,
        nova_data_fim: novaDataFim,
      }),
    });
  }

  // Calcular estatísticas dos compromissos
  async getCommitmentStats(userId: string): Promise<CommitmentStats> {
    try {
      // Buscar todos os compromissos
      const compromissos = await this.getCommitments(userId);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      // Calcular estatísticas
      const stats: CommitmentStats = {
        total_compromissos: compromissos.length,
        compromissos_hoje: 0,
        compromissos_semana: 0,
        compromissos_vencidos: 0,
        compromissos_concluidos: compromissos.filter(c => c.status === 'concluido').length,
        compromissos_agendados: compromissos.filter(c => c.status === 'agendado').length,
        compromissos_por_tipo: {
          reuniao: compromissos.filter(c => c.tipo === 'reuniao').length,
          pagamento: compromissos.filter(c => c.tipo === 'pagamento').length,
          evento: compromissos.filter(c => c.tipo === 'evento').length,
          lembrete: compromissos.filter(c => c.tipo === 'lembrete').length,
          aniversario: compromissos.filter(c => c.tipo === 'aniversario').length,
        },
      };

      // Processar cada compromisso
      compromissos.forEach(compromisso => {
        const dataInicio = new Date(compromisso.data_inicio);
        const dataFim = new Date(compromisso.data_fim);

        // Compromissos de hoje
        if (dataInicio.toDateString() === hoje.toDateString()) {
          stats.compromissos_hoje++;
        }

        // Compromissos da semana
        if (dataInicio >= inicioSemana && dataInicio <= fimSemana) {
          stats.compromissos_semana++;
        }

        // Compromissos vencidos (passou da data e não foi concluído)
        if (dataFim < hoje && compromisso.status === 'agendado') {
          stats.compromissos_vencidos++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating commitment stats:', error);
      // Retornar estatísticas vazias em caso de erro
      return {
        total_compromissos: 0,
        compromissos_hoje: 0,
        compromissos_semana: 0,
        compromissos_vencidos: 0,
        compromissos_concluidos: 0,
        compromissos_agendados: 0,
        compromissos_por_tipo: {
          reuniao: 0,
          pagamento: 0,
          evento: 0,
          lembrete: 0,
          aniversario: 0,
        },
      };
    }
  }

  // ========== GOOGLE CALENDAR INTEGRATION ==========

  // Obter status de autenticação Google
  async getGoogleAuthStatus(userId: string): Promise<GoogleAuthStatus> {
    return this.makeRequest<GoogleAuthStatus>(`/compromissos/usuario/${userId}/google/status`);
  }

  // Iniciar processo de autenticação Google
  async startGoogleAuth(userId: string): Promise<{ auth_url: string }> {
    return this.makeRequest<{ auth_url: string }>(`/compromissos/usuario/${userId}/google/auth`);
  }

  // Desconectar Google Calendar
  async disconnectGoogle(userId: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/compromissos/usuario/${userId}/google/disconnect`, {
      method: 'DELETE',
    });
  }

  // Sincronizar com Google Calendar
  async syncWithGoogle(userId: string): Promise<{ message: string; synced_count: number }> {
    return this.makeRequest<{ message: string; synced_count: number }>(
      `/compromissos/usuario/${userId}/google/sync`,
      { method: 'POST' }
    );
  }

  // ========== UTILITY METHODS ==========

  // Verificar se um compromisso está vencido
  isOverdue(commitment: Commitment): boolean {
    const now = new Date();
    const endDate = new Date(commitment.data_fim);
    return endDate < now && commitment.status === 'agendado';
  }

  // Verificar se um compromisso é hoje
  isToday(commitment: Commitment): boolean {
    const today = new Date();
    const startDate = new Date(commitment.data_inicio);
    return startDate.toDateString() === today.toDateString();
  }

  // Calcular dias restantes
  getDaysUntil(commitment: Commitment): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(commitment.data_inicio);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = startDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Formatar data para display
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Formatar apenas data
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  // Formatar apenas hora
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export const commitmentApi = new CommitmentAPI();