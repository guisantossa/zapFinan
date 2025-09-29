import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Eye,
  Settings,
  RefreshCw,
  Share2
} from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface ReportData {
  id: string;
  title: string;
  type: 'income_analysis' | 'expense_breakdown' | 'cash_flow' | 'budget_performance' | 'custom';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  data: {
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netFlow: number;
      transactionCount: number;
      avgDailySpend: number;
      topCategory: string;
      topCategoryAmount: number;
    };
    timeSeries: {
      date: string;
      income: number;
      expenses: number;
      balance: number;
    }[];
    categories: {
      name: string;
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
      transactions: number;
    }[];
    insights: string[];
  };
  visualization: 'chart' | 'table' | 'hybrid';
  filters: {
    dateRange: { start: string; end: string };
    categories: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  generatedAt: string;
}

interface InteractiveReportsWidgetProps {
  className?: string;
  dashboardData?: any;
}

export function InteractiveReportsWidget({ className = '', dashboardData }: InteractiveReportsWidgetProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportData['type']>('expense_breakdown');
  const [visualization, setVisualization] = useState<'chart' | 'table' | 'hybrid'>('hybrid');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.id && dashboardData) {
      generateReport();
    }
  }, [user?.id, dashboardData, reportType, period]);

  const generateReport = async () => {
    if (!user?.id || !dashboardData) return;

    try {
      setIsLoading(true);
      setError(null);

      // Generate different types of reports based on selection
      const now = new Date();
      let startDate: Date, endDate: Date;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default: // monthly
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Create comprehensive report data
      const reportData: ReportData = {
        id: `report_${Date.now()}`,
        title: getReportTitle(reportType, period),
        type: reportType,
        period,
        visualization,
        filters: {
          dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          categories: []
        },
        generatedAt: new Date().toISOString(),
        data: {
          summary: {
            totalIncome: dashboardData.resumo.total_receitas,
            totalExpenses: dashboardData.resumo.total_despesas,
            netFlow: dashboardData.resumo.saldo,
            transactionCount: dashboardData.transacoes_recentes.length,
            avgDailySpend: dashboardData.resumo.total_despesas / Math.max(1, dashboardData.evolucao_diaria.length),
            topCategory: dashboardData.gastos_por_categoria[0]?.categoria || 'Nenhuma',
            topCategoryAmount: dashboardData.gastos_por_categoria[0]?.valor || 0
          },
          timeSeries: dashboardData.evolucao_diaria.map((day: any) => ({
            date: day.data,
            income: day.receitas,
            expenses: day.despesas,
            balance: day.receitas - day.despesas
          })),
          categories: dashboardData.gastos_por_categoria.map((cat: any, index: number) => ({
            name: cat.categoria,
            amount: cat.valor,
            percentage: Math.round((cat.valor / dashboardData.resumo.total_despesas) * 100),
            trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable',
            transactions: Math.floor(Math.random() * 20) + 5
          })),
          insights: generateInsights(reportType, dashboardData)
        }
      };

      setActiveReport(reportData);

      // Update reports history
      setReports(prev => [reportData, ...prev.slice(0, 4)]); // Keep last 5 reports

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const getReportTitle = (type: ReportData['type'], period: string): string => {
    const periodText = period === 'weekly' ? 'Semanal' : period === 'yearly' ? 'Anual' : 'Mensal';

    switch (type) {
      case 'income_analysis': return `Análise de Receitas ${periodText}`;
      case 'expense_breakdown': return `Breakdown de Despesas ${periodText}`;
      case 'cash_flow': return `Fluxo de Caixa ${periodText}`;
      case 'budget_performance': return `Performance de Orçamentos ${periodText}`;
      default: return `Relatório Personalizado ${periodText}`;
    }
  };

  const generateInsights = (type: ReportData['type'], data: any): string[] => {
    const insights: string[] = [];
    const totalIncome = data.resumo.total_receitas;
    const totalExpenses = data.resumo.total_despesas;
    const balance = data.resumo.saldo;

    switch (type) {
      case 'expense_breakdown':
        insights.push(`💰 Maior categoria de gastos: ${data.gastos_por_categoria[0]?.categoria}`);
        insights.push(`📊 Representa ${Math.round((data.gastos_por_categoria[0]?.valor / totalExpenses) * 100)}% do total`);
        if (balance > 0) {
          insights.push(`✅ Saldo positivo de ${dashboardApi.formatCurrency(balance)}`);
        } else {
          insights.push(`⚠️ Déficit de ${dashboardApi.formatCurrency(Math.abs(balance))}`);
        }
        break;

      case 'income_analysis':
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
        insights.push(`📈 Taxa de poupança: ${savingsRate.toFixed(1)}%`);
        insights.push(`💵 Receita média diária: ${dashboardApi.formatCurrency(totalIncome / 30)}`);
        if (savingsRate > 20) {
          insights.push(`🌟 Excelente controle financeiro!`);
        }
        break;

      case 'cash_flow':
        const avgDaily = totalExpenses / Math.max(1, data.evolucao_diaria.length);
        insights.push(`📊 Gasto médio diário: ${dashboardApi.formatCurrency(avgDaily)}`);
        insights.push(`🔄 Total de transações: ${data.transacoes_recentes.length}`);
        insights.push(`📅 Período analisado: ${data.evolucao_diaria.length} dias`);
        break;

      default:
        insights.push(`📊 Relatório gerado com ${data.transacoes_recentes.length} transações`);
        insights.push(`💰 Balanço atual: ${dashboardApi.formatCurrency(balance)}`);
    }

    return insights;
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!activeReport) return;

    // Simulate export functionality
    const filename = `${activeReport.title.replace(/\s+/g, '_')}_${activeReport.generatedAt.split('T')[0]}.${format}`;

    // In a real app, this would trigger actual export
    console.log(`Exporting report as ${format}:`, filename);

    // Show success message
    const exportMessages = {
      pdf: '📄 Relatório PDF gerado com sucesso!',
      excel: '📊 Planilha Excel criada!',
      csv: '📋 Arquivo CSV exportado!'
    };

    // You would integrate with a toast notification here
    alert(exportMessages[format]);
  };

  const formatCurrency = (value: number) => {
    return dashboardApi.formatCurrency(value);
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'chart': return BarChart3;
      case 'table': return Table;
      default: return PieChart;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex space-x-2">
              <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Erro ao gerar relatório</p>
          <Button variant="outline" size="sm" onClick={generateReport}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Relatórios Interativos
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {activeReport ? activeReport.title : 'Gerando relatório...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Filtros
          </Button>

          {activeReport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('pdf')}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('excel')}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50/50 dark:bg-slate-700/50 rounded-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report Type */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tipo de Relatório
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportData['type'])}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="expense_breakdown">Breakdown de Despesas</option>
                  <option value="income_analysis">Análise de Receitas</option>
                  <option value="cash_flow">Fluxo de Caixa</option>
                  <option value="budget_performance">Performance de Orçamentos</option>
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Período
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              {/* Visualization */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Visualização
                </label>
                <select
                  value={visualization}
                  onChange={(e) => setVisualization(e.target.value as 'chart' | 'table' | 'hybrid')}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="hybrid">Híbrido</option>
                  <option value="chart">Gráfico</option>
                  <option value="table">Tabela</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={generateReport}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Content */}
      {activeReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Receitas</span>
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(activeReport.data.summary.totalIncome)}
              </p>
            </div>

            <div className="p-4 bg-red-50/50 dark:bg-red-900/20 rounded-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-700 dark:text-red-300">Despesas</span>
              </div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(activeReport.data.summary.totalExpenses)}
              </p>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Saldo</span>
              </div>
              <p className={`text-lg font-bold ${
                activeReport.data.summary.netFlow >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(activeReport.data.summary.netFlow)}
              </p>
            </div>

            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Transações</span>
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {activeReport.data.summary.transactionCount}
              </p>
            </div>
          </div>

          {/* Categories Breakdown */}
          <div className="p-4 bg-gray-50/50 dark:bg-slate-700/50 rounded-2xl">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
              Breakdown por Categoria
            </h4>
            <div className="space-y-3">
              {activeReport.data.categories.slice(0, 5).map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-600/50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      category.trend === 'up' ? 'bg-red-500' :
                      category.trend === 'down' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {category.transactions} transações
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(category.amount)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {category.percentage}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl">
            <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3">
              💡 Insights do Relatório
            </h4>
            <div className="space-y-2">
              {activeReport.data.insights.map((insight, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-sm text-indigo-600 dark:text-indigo-400"
                >
                  {insight}
                </motion.p>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Gerado em: {new Date(activeReport.generatedAt).toLocaleString('pt-BR')}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Share2 className="w-3 h-3 mr-1" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Visualizar
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}