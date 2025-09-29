import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Target, Calendar, DollarSign, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface ForecastData {
  nextMonth: {
    expectedIncome: number;
    expectedExpenses: number;
    projectedBalance: number;
    confidence: number;
  };
  next3Months: {
    expectedIncome: number;
    expectedExpenses: number;
    projectedBalance: number;
    confidence: number;
  };
  yearEnd: {
    expectedIncome: number;
    expectedExpenses: number;
    projectedBalance: number;
    confidence: number;
  };
  insights: {
    budgetRisk: 'low' | 'medium' | 'high';
    savingsProjection: number;
    recommendedActions: string[];
    trends: {
      income: 'increasing' | 'stable' | 'decreasing';
      expenses: 'increasing' | 'stable' | 'decreasing';
    };
  };
}

interface FinancialForecastWidgetProps {
  className?: string;
  dashboardData?: any;
}

export function FinancialForecastWidget({ className = '', dashboardData }: FinancialForecastWidgetProps) {
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user?.id && dashboardData) {
      generateForecast();
    }
  }, [user?.id, dashboardData]);

  const generateForecast = async () => {
    if (!user?.id || !dashboardData) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get historical data for better predictions
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const historicalData = await dashboardApi.getDashboardData(
        user.id,
        sixMonthsAgo.toISOString().split('T')[0],
        now.toISOString().split('T')[0]
      );

      // Simple linear regression for trend analysis
      const calculateTrend = (values: number[]): 'increasing' | 'stable' | 'decreasing' => {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.length > 0
          ? dashboardApi.safeDivision(firstHalf.reduce((a, b) => a + b, 0), firstHalf.length)
          : 0;

        const secondAvg = secondHalf.length > 0
          ? dashboardApi.safeDivision(secondHalf.reduce((a, b) => a + b, 0), secondHalf.length)
          : 0;

        const changePercent = dashboardApi.safePercentage(secondAvg, firstAvg, 0);

        if (Math.abs(changePercent) < 5) return 'stable';
        return changePercent > 0 ? 'increasing' : 'decreasing';
      };

      // Extract monthly patterns with safe data handling
      const monthlyIncomes = (dashboardData.evolucao_diaria || []).map((day: any) => dashboardApi.safeNumber(day.receitas));
      const monthlyExpenses = (dashboardData.evolucao_diaria || []).map((day: any) => dashboardApi.safeNumber(day.despesas));

      const avgDailyIncome = monthlyIncomes.length > 0
        ? dashboardApi.safeDivision(monthlyIncomes.reduce((a: number, b: number) => a + b, 0), monthlyIncomes.length)
        : 0;

      const avgDailyExpenses = monthlyExpenses.length > 0
        ? dashboardApi.safeDivision(monthlyExpenses.reduce((a: number, b: number) => a + b, 0), monthlyExpenses.length)
        : 0;

      // Calculate seasonal multipliers (basic seasonality)
      const currentMonth = now.getMonth();
      const seasonalMultiplier = {
        income: currentMonth === 11 ? 1.2 : currentMonth === 0 ? 0.9 : 1.0, // December bonus, January low
        expenses: currentMonth === 11 ? 1.3 : currentMonth === 0 ? 0.8 : 1.0 // Holiday spending
      };

      // Trend multipliers
      const incomeTrend = calculateTrend(monthlyIncomes);
      const expensesTrend = calculateTrend(monthlyExpenses);

      const trendMultiplier = {
        income: incomeTrend === 'increasing' ? 1.05 : incomeTrend === 'decreasing' ? 0.95 : 1.0,
        expenses: expensesTrend === 'increasing' ? 1.05 : expensesTrend === 'decreasing' ? 0.95 : 1.0
      };

      // Calculate forecasts
      const nextMonthIncome = avgDailyIncome * 30 * seasonalMultiplier.income * trendMultiplier.income;
      const nextMonthExpenses = avgDailyExpenses * 30 * seasonalMultiplier.expenses * trendMultiplier.expenses;

      const next3MonthsIncome = nextMonthIncome * 3;
      const next3MonthsExpenses = nextMonthExpenses * 3;

      const remainingMonths = 12 - now.getMonth();
      const yearEndIncome = dashboardData.resumo.total_receitas + (nextMonthIncome * remainingMonths);
      const yearEndExpenses = dashboardData.resumo.total_despesas + (nextMonthExpenses * remainingMonths);

      // Calculate confidence based on data stability
      const incomeStability = monthlyIncomes.length > 0 && avgDailyIncome > 0
        ? dashboardApi.safeNumber(100 - dashboardApi.safeDivision(Math.abs(Math.max(...monthlyIncomes) - Math.min(...monthlyIncomes)), avgDailyIncome), 50)
        : 50;

      const expenseStability = monthlyExpenses.length > 0 && avgDailyExpenses > 0
        ? dashboardApi.safeNumber(100 - dashboardApi.safeDivision(Math.abs(Math.max(...monthlyExpenses) - Math.min(...monthlyExpenses)), avgDailyExpenses), 50)
        : 50;

      const baseConfidence = Math.min(dashboardApi.safeDivision(incomeStability + expenseStability, 2, 50), 95);

      // Risk assessment
      const projectedBalance = dashboardApi.safeNumber(nextMonthIncome - nextMonthExpenses);
      const currentSavingsRate = dashboardApi.safeDivision(
        dashboardApi.safeNumber(dashboardData.resumo?.saldo),
        dashboardApi.safeNumber(dashboardData.resumo?.total_receitas),
        0
      );

      let budgetRisk: 'low' | 'medium' | 'high' = 'low';
      if (projectedBalance < 0) budgetRisk = 'high';
      else if (currentSavingsRate < 0.1) budgetRisk = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      if (budgetRisk === 'high') {
        recommendations.push('Reduza gastos desnecessários');
        recommendations.push('Busque fontes de renda adicional');
      }
      if (expensesTrend === 'increasing') {
        recommendations.push('Monitore o crescimento de despesas');
      }
      if (currentSavingsRate < 0.2) {
        recommendations.push('Aumente sua taxa de poupança');
      }
      if (recommendations.length === 0) {
        recommendations.push('Continue mantendo seu controle financeiro');
      }

      const forecast: ForecastData = {
        nextMonth: {
          expectedIncome: nextMonthIncome,
          expectedExpenses: nextMonthExpenses,
          projectedBalance: projectedBalance,
          confidence: Math.max(baseConfidence, 60)
        },
        next3Months: {
          expectedIncome: next3MonthsIncome,
          expectedExpenses: next3MonthsExpenses,
          projectedBalance: next3MonthsIncome - next3MonthsExpenses,
          confidence: Math.max(baseConfidence - 10, 50)
        },
        yearEnd: {
          expectedIncome: yearEndIncome,
          expectedExpenses: yearEndExpenses,
          projectedBalance: yearEndIncome - yearEndExpenses,
          confidence: Math.max(baseConfidence - 20, 40)
        },
        insights: {
          budgetRisk,
          savingsProjection: (nextMonthIncome - nextMonthExpenses) * 12,
          recommendedActions: recommendations,
          trends: {
            income: incomeTrend,
            expenses: expensesTrend
          }
        }
      };

      setForecastData(forecast);

    } catch (err: any) {
      console.error('Error generating forecast:', err);
      setError(err.message || 'Erro ao gerar previsões');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-100 dark:bg-green-900/50';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/50';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const formatCurrency = (value: number) => {
    return dashboardApi.formatCurrency(value);
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Erro ao gerar previsões</p>
          <Button variant="outline" size="sm" onClick={generateForecast}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!forecastData) return null;

  const forecasts = [
    {
      label: 'Próximo Mês',
      data: forecastData.nextMonth,
      icon: Calendar
    },
    {
      label: 'Próximos 3 Meses',
      data: forecastData.next3Months,
      icon: Target
    },
    {
      label: 'Final do Ano',
      data: forecastData.yearEnd,
      icon: TrendingUp
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Previsões Financeiras
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDetails(!showDetails)}
            className="w-8 h-8"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {forecasts.map((forecast, index) => {
          const Icon = forecast.icon;

          return (
            <motion.div
              key={forecast.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-4 bg-gray-50/50 dark:bg-slate-700/50 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {forecast.label}
                  </span>
                </div>
                <span className={`text-xs font-bold ${getConfidenceColor(forecast.data.confidence)}`}>
                  {forecast.data.confidence.toFixed(0)}% confiança
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo Projetado</p>
                  <p className={`text-lg font-bold ${
                    forecast.data.projectedBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(forecast.data.projectedBalance)}
                  </p>
                </div>

                {showDetails && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receitas</p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(forecast.data.expectedIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Despesas</p>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(forecast.data.expectedExpenses)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Insights Section */}
      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risco Orçamentário</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRiskColor(forecastData.insights.budgetRisk)}`}>
              {forecastData.insights.budgetRisk === 'low' ? 'Baixo' :
               forecastData.insights.budgetRisk === 'medium' ? 'Médio' : 'Alto'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Tendência Receitas: {getTrendIcon(forecastData.insights.trends.income)}</span>
            <span>Tendência Despesas: {getTrendIcon(forecastData.insights.trends.expenses)}</span>
          </div>

          {showDetails && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recomendações:</p>
              {forecastData.insights.recommendedActions.map((action, index) => (
                <p key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                  {action}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}