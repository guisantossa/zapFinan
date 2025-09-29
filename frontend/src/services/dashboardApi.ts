import {
  DashboardData,
  PeriodSummary,
  PeriodFilter,
  ComparativoPeriodo,
  DashboardStats
} from '../types/dashboard';

const API_BASE = 'http://localhost:8000';

class DashboardAPI {
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

  // Obter dados completos do dashboard
  async getDashboardData(
    userId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);

    const queryString = params.toString();
    const endpoint = `/dashboard/${userId}/dados${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<DashboardData>(endpoint);
  }

  // Obter resumo de período específico
  async getPeriodSummary(
    userId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<PeriodSummary> {
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim
    });

    return this.makeRequest<PeriodSummary>(`/dashboard/${userId}/periodo?${params}`);
  }

  // Calcular datas para filtros predefinidos
  getPeriodDates(periodType: string): { data_inicio: string; data_fim: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (periodType) {
      case 'current_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          data_inicio: startOfMonth.toISOString().split('T')[0],
          data_fim: endOfMonth.toISOString().split('T')[0]
        };
      }

      case 'last_month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          data_inicio: startOfLastMonth.toISOString().split('T')[0],
          data_fim: endOfLastMonth.toISOString().split('T')[0]
        };
      }

      case 'last_3_months': {
        const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          data_inicio: startDate.toISOString().split('T')[0],
          data_fim: endDate.toISOString().split('T')[0]
        };
      }

      case 'current_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        return {
          data_inicio: startOfYear.toISOString().split('T')[0],
          data_fim: endOfYear.toISOString().split('T')[0]
        };
      }

      default: {
        // Default para mês atual
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          data_inicio: startOfMonth.toISOString().split('T')[0],
          data_fim: endOfMonth.toISOString().split('T')[0]
        };
      }
    }
  }

  // Obter dados para comparação de períodos
  async getComparativoPeriodo(
    userId: string,
    periodoAtual: { data_inicio: string; data_fim: string },
    periodoAnterior: { data_inicio: string; data_fim: string }
  ): Promise<ComparativoPeriodo> {
    const [dadosAtual, dadosAnterior] = await Promise.all([
      this.getDashboardData(userId, periodoAtual.data_inicio, periodoAtual.data_fim),
      this.getDashboardData(userId, periodoAnterior.data_inicio, periodoAnterior.data_fim)
    ]);

    const crescimento_receitas = dadosAnterior.resumo.total_receitas > 0
      ? ((dadosAtual.resumo.total_receitas - dadosAnterior.resumo.total_receitas) / dadosAnterior.resumo.total_receitas) * 100
      : 0;

    const crescimento_despesas = dadosAnterior.resumo.total_despesas > 0
      ? ((dadosAtual.resumo.total_despesas - dadosAnterior.resumo.total_despesas) / dadosAnterior.resumo.total_despesas) * 100
      : 0;

    const crescimento_saldo = dadosAnterior.resumo.saldo !== 0
      ? ((dadosAtual.resumo.saldo - dadosAnterior.resumo.saldo) / Math.abs(dadosAnterior.resumo.saldo)) * 100
      : 0;

    return {
      periodo_atual: dadosAtual.resumo,
      periodo_anterior: dadosAnterior.resumo,
      crescimento_receitas,
      crescimento_despesas,
      crescimento_saldo
    };
  }

  // Calcular estatísticas avançadas do dashboard
  async calculateDashboardStats(
    userId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<DashboardStats> {
    const dados = await this.getDashboardData(userId, dataInicio, dataFim);

    // Calcular crescimentos (comparar com período anterior)
    const periodoAtual = this.getPeriodDates('current_month');
    const periodoAnterior = this.getPeriodDates('last_month');

    const comparativo = await this.getComparativoPeriodo(
      userId,
      periodoAtual,
      periodoAnterior
    );

    // Calcular média diária de gastos
    const diasPeriodo = dados.evolucao_diaria.length;
    const media_diaria_gastos = diasPeriodo > 0
      ? dados.resumo.total_despesas / diasPeriodo
      : 0;

    // Encontrar categoria com maior gasto
    const categoriaMaiorGasto = dados.gastos_por_categoria.reduce(
      (prev, current) => (prev.valor > current.valor) ? prev : current,
      dados.gastos_por_categoria[0] || { categoria: 'Nenhuma', valor: 0 }
    );

    // Calcular economia do mês (diferença para mês anterior)
    const economia_mes = comparativo.periodo_anterior.total_despesas - dados.resumo.total_despesas;

    return {
      total_receitas: dados.resumo.total_receitas,
      total_despesas: dados.resumo.total_despesas,
      saldo: dados.resumo.saldo,
      crescimento_receitas: comparativo.crescimento_receitas,
      crescimento_despesas: comparativo.crescimento_despesas,
      economia_mes,
      media_diaria_gastos,
      categoria_maior_gasto: categoriaMaiorGasto.categoria,
      transacoes_mes: dados.transacoes_recentes.length
    };
  }

  // Utilitários de validação numérica
  safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    return num;
  }

  safePercentage(current: number, previous: number, defaultValue: number = 0): number {
    current = this.safeNumber(current);
    previous = this.safeNumber(previous);

    if (previous === 0) {
      return current > 0 ? 100 : defaultValue;
    }

    const percentage = ((current - previous) / previous) * 100;
    return this.safeNumber(percentage, defaultValue);
  }

  safeDivision(numerator: number, denominator: number, defaultValue: number = 0): number {
    numerator = this.safeNumber(numerator);
    denominator = this.safeNumber(denominator);

    if (denominator === 0) return defaultValue;

    const result = numerator / denominator;
    return this.safeNumber(result, defaultValue);
  }

  // Formatadores utilitários
  formatCurrency(value: number): string {
    const safeValue = this.safeNumber(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeValue);
  }

  formatPercentage(value: number): string {
    const safeValue = this.safeNumber(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(safeValue / 100);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  // Calcular período anterior com base no atual
  getPreviousPeriod(dataInicio: string, dataFim: string): { data_inicio: string; data_fim: string } {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 3600 * 24));

    const inicioAnterior = new Date(inicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - dias);

    const fimAnterior = new Date(inicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    return {
      data_inicio: inicioAnterior.toISOString().split('T')[0],
      data_fim: fimAnterior.toISOString().split('T')[0]
    };
  }
}

export const dashboardApi = new DashboardAPI();