import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface TrendData {
  daily: {
    dates: string[];
    revenues: number[];
    expenses: number[];
    trends: {
      revenue: { direction: 'up' | 'down' | 'stable'; strength: number };
      expenses: { direction: 'up' | 'down' | 'stable'; strength: number };
    };
  };
  categories: {
    name: string;
    currentAmount: number;
    previousAmount: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  }[];
  patterns: {
    weekdaySpending: { day: string; amount: number; percentage: number }[];
    monthlyDistribution: { week: string; amount: number; percentage: number }[];
    insights: string[];
  };
  efficiency: {
    score: number;
    factors: {
      name: string;
      score: number;
      impact: 'positive' | 'negative' | 'neutral';
    }[];
  };
}

interface TrendAnalysisWidgetProps {
  className?: string;
  dashboardData?: any;
}

export function TrendAnalysisWidget({ className = '', dashboardData }: TrendAnalysisWidgetProps) {
  const { user } = useAuth();
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'trends' | 'patterns' | 'efficiency'>('trends');

  useEffect(() => {
    if (user?.id && dashboardData) {
      analyzeTrends();
    }
  }, [user?.id, dashboardData]);

  const analyzeTrends = async () => {
    if (!user?.id || !dashboardData) return;

    try {
      setIsLoading(true);
      setError(null);

      // Analyze daily trends with safe data handling
      const dailyData = dashboardData?.evolucao_diaria || [];
      const dates = dailyData.map((day: any) => day.data);
      const revenues = dailyData.map((day: any) => dashboardApi.safeNumber(day.receitas));
      const expenses = dailyData.map((day: any) => dashboardApi.safeNumber(day.despesas));

      // Calculate trend direction and strength using linear regression
      const calculateTrend = (values: number[]) => {
        if (values.length < 3) return { direction: 'stable' as const, strength: 0 };

        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = values.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
          numerator += (i - xMean) * (values[i] - yMean);
          denominator += Math.pow(i - xMean, 2);
        }

        const slope = dashboardApi.safeDivision(numerator, denominator, 0);
        const strength = dashboardApi.safeDivision(Math.abs(slope) * 100, yMean || 1, 0);

        let direction: 'up' | 'down' | 'stable' = 'stable';
        if (strength > 5) {
          direction = slope > 0 ? 'up' : 'down';
        }

        return { direction, strength: Math.min(strength, 100) };
      };

      const revenueTrend = calculateTrend(revenues);
      const expensesTrend = calculateTrend(expenses);

      // Analyze category trends
      const currentCategories = dashboardData?.gastos_por_categoria || [];

      // Get previous period data for comparison
      const now = new Date();
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      let previousData;
      try {
        previousData = await dashboardApi.getDashboardData(
          user.id,
          previousMonthStart.toISOString().split('T')[0],
          previousMonthEnd.toISOString().split('T')[0]
        );
      } catch {
        // If previous data is not available, create mock data
        previousData = { gastos_por_categoria: [] };
      }

      const categoryTrends = currentCategories.map((category: any) => {
        const previousCategory = (previousData?.gastos_por_categoria || []).find(
          (prev: any) => prev.categoria === category.categoria
        );
        const previousAmount = dashboardApi.safeNumber(previousCategory?.valor);
        const currentAmount = dashboardApi.safeNumber(category.valor);

        let trend: 'up' | 'down' | 'stable' = 'stable';
        let percentage = 0;

        if (previousAmount > 0) {
          percentage = dashboardApi.safePercentage(currentAmount, previousAmount, 0);
          if (Math.abs(percentage) > 10) {
            trend = percentage > 0 ? 'up' : 'down';
          }
        } else if (currentAmount > 0) {
          trend = 'up';
          percentage = 100;
        }

        return {
          name: category.categoria,
          currentAmount,
          previousAmount,
          trend,
          percentage: Math.round(dashboardApi.safeNumber(percentage))
        };
      }).sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage));

      // Analyze spending patterns based on real daily data
      const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weekdaySpending = weekdays.map(day => ({ day, amount: 0, percentage: 0 }));

      const totalExpenses = expenses.reduce((a, b) => a + b, 0);

      // Calculate real weekday distribution from daily data
      if (dailyData.length > 0) {
        const weekdayCounts = new Array(7).fill(0);
        const weekdayAmounts = new Array(7).fill(0);

        dailyData.forEach((day: any, index: number) => {
          const dayOfWeek = index % 7; // Simple weekday calculation
          const expense = dashboardApi.safeNumber(day.despesas);
          weekdayCounts[dayOfWeek]++;
          weekdayAmounts[dayOfWeek] += expense;
        });

        weekdaySpending.forEach((day, index) => {
          day.amount = weekdayAmounts[index];
          day.percentage = totalExpenses > 0
            ? dashboardApi.safeDivision(weekdayAmounts[index] * 100, totalExpenses)
            : 0;
        });
      }

      // Monthly distribution based on daily progression
      const monthlyDistribution = [];
      if (dailyData.length > 0) {
        const weeksInMonth = Math.ceil(dailyData.length / 7);
        for (let week = 0; week < Math.min(weeksInMonth, 4); week++) {
          const startDay = week * 7;
          const endDay = Math.min((week + 1) * 7, dailyData.length);
          const weekData = dailyData.slice(startDay, endDay);
          const weekAmount = weekData.reduce((sum: number, day: any) => sum + dashboardApi.safeNumber(day.despesas), 0);
          const weekPercentage = totalExpenses > 0
            ? dashboardApi.safeDivision(weekAmount * 100, totalExpenses)
            : 0;

          monthlyDistribution.push({
            week: `Semana ${week + 1}`,
            amount: weekAmount,
            percentage: Math.round(weekPercentage)
          });
        }
      }

      // Fallback if no data available
      if (monthlyDistribution.length === 0) {
        monthlyDistribution.push(
          { week: 'Dados insuficientes', amount: 0, percentage: 0 }
        );
      }

      // Generate insights
      const insights: string[] = [];

      if (revenueTrend.direction === 'up') {
        insights.push(`📈 Receitas crescendo ${revenueTrend.strength.toFixed(1)}%`);
      } else if (revenueTrend.direction === 'down') {
        insights.push(`📉 Receitas declinando ${revenueTrend.strength.toFixed(1)}%`);
      }

      if (expensesTrend.direction === 'up') {
        insights.push(`⚠️ Despesas aumentando ${expensesTrend.strength.toFixed(1)}%`);
      } else if (expensesTrend.direction === 'down') {
        insights.push(`✅ Despesas diminuindo ${expensesTrend.strength.toFixed(1)}%`);
      }

      const topGrowingCategory = categoryTrends.find(cat => cat.trend === 'up');
      if (topGrowingCategory) {
        insights.push(`📊 ${topGrowingCategory.name} aumentou ${topGrowingCategory.percentage}%`);
      }

      const highestWeekday = weekdaySpending.reduce((max, day) => day.percentage > max.percentage ? day : max);
      if (highestWeekday.percentage > 20) {
        insights.push(`📅 ${highestWeekday.day} representa ${highestWeekday.percentage.toFixed(1)}% dos gastos semanais`);
      }

      if (insights.length === 0) {
        insights.push('📊 Padrões estáveis de gastos observados');
      }

      // Calculate efficiency score
      const efficiencyFactors = [
        {
          name: 'Controle de Gastos',
          score: expensesTrend.direction === 'down' ? 90 : expensesTrend.direction === 'stable' ? 70 : 40,
          impact: expensesTrend.direction === 'down' ? 'positive' as const :
                  expensesTrend.direction === 'stable' ? 'neutral' as const : 'negative' as const
        },
        {
          name: 'Crescimento de Receitas',
          score: revenueTrend.direction === 'up' ? 85 : revenueTrend.direction === 'stable' ? 60 : 30,
          impact: revenueTrend.direction === 'up' ? 'positive' as const :
                  revenueTrend.direction === 'stable' ? 'neutral' as const : 'negative' as const
        },
        {
          name: 'Diversificação de Gastos',
          score: categoryTrends.length > 3 ? 80 : categoryTrends.length > 1 ? 60 : 40,
          impact: categoryTrends.length > 3 ? 'positive' as const : 'neutral' as const
        },
        {
          name: 'Previsibilidade',
          score: Math.max(0, 100 - (revenueTrend.strength + expensesTrend.strength) / 2),
          impact: (revenueTrend.strength + expensesTrend.strength) / 2 < 20 ? 'positive' as const : 'neutral' as const
        }
      ];

      const overallScore = efficiencyFactors.reduce((sum, factor) => sum + factor.score, 0) / efficiencyFactors.length;

      const trendAnalysis: TrendData = {
        daily: {
          dates,
          revenues,
          expenses,
          trends: {
            revenue: revenueTrend,
            expenses: expensesTrend
          }
        },
        categories: categoryTrends,
        patterns: {
          weekdaySpending,
          monthlyDistribution,
          insights
        },
        efficiency: {
          score: Math.round(overallScore),
          factors: efficiencyFactors
        }
      };

      setTrendData(trendAnalysis);

    } catch (err: any) {
      console.error('Error analyzing trends:', err);
      setError(err.message || 'Erro ao analisar tendências');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Activity;
    }
  };

  const getTrendColor = (direction: string, isExpense = false) => {
    if (direction === 'stable') return 'text-gray-500';

    if (isExpense) {
      return direction === 'up' ? 'text-red-500' : 'text-green-500';
    } else {
      return direction === 'up' ? 'text-green-500' : 'text-red-500';
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
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
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Erro ao analisar tendências</p>
          <Button variant="outline" size="sm" onClick={analyzeTrends}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!trendData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Análise de Tendências
        </h3>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('trends')}
            className="text-xs"
          >
            <LineChart className="w-3 h-3 mr-1" />
            Tendências
          </Button>
          <Button
            variant={viewMode === 'patterns' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('patterns')}
            className="text-xs"
          >
            <PieChart className="w-3 h-3 mr-1" />
            Padrões
          </Button>
          <Button
            variant={viewMode === 'efficiency' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('efficiency')}
            className="text-xs"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Eficiência
          </Button>
        </div>
      </div>

      {viewMode === 'trends' && (
        <div className="space-y-4">
          {/* Overall trends */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50/50 dark:bg-green-900/20 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Receitas</span>
                {React.createElement(getTrendIcon(trendData.daily.trends.revenue.direction), {
                  className: `w-4 h-4 ${getTrendColor(trendData.daily.trends.revenue.direction)}`
                })}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Força: {trendData.daily.trends.revenue.strength.toFixed(1)}%
              </p>
            </div>

            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Despesas</span>
                {React.createElement(getTrendIcon(trendData.daily.trends.expenses.direction), {
                  className: `w-4 h-4 ${getTrendColor(trendData.daily.trends.expenses.direction, true)}`
                })}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Força: {trendData.daily.trends.expenses.strength.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Category trends */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Tendências por Categoria</h4>
            <div className="space-y-2">
              {trendData.categories.slice(0, 4).map((category, index) => {
                const TrendIcon = getTrendIcon(category.trend);

                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <TrendIcon className={`w-4 h-4 ${getTrendColor(category.trend, true)}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(category.currentAmount)}
                      </p>
                      <p className={`text-xs ${getTrendColor(category.trend, true)}`}>
                        {category.percentage > 0 ? '+' : ''}{category.percentage}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'patterns' && (
        <div className="space-y-4">
          {/* Insights */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Insights dos Padrões</h4>
            <div className="space-y-2">
              {trendData.patterns.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl"
                >
                  <p className="text-sm text-blue-700 dark:text-blue-300">{insight}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Weekly distribution */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Distribuição Semanal</h4>
            <div className="grid grid-cols-4 gap-2">
              {trendData.patterns.monthlyDistribution.map((week, index) => (
                <div key={week.week} className="text-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${week.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{week.week}</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{week.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'efficiency' && (
        <div className="space-y-4">
          {/* Overall efficiency score */}
          <div className="text-center p-6 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Score de Eficiência</h4>
            <div className={`text-4xl font-bold ${getEfficiencyColor(trendData.efficiency.score)} mb-2`}>
              {trendData.efficiency.score}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">de 100 pontos</p>
          </div>

          {/* Efficiency factors */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Fatores de Eficiência</h4>
            <div className="space-y-3">
              {trendData.efficiency.factors.map((factor, index) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-slate-700/50 rounded-xl"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {factor.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${getEfficiencyColor(factor.score)}`}>
                      {factor.score}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      factor.impact === 'positive' ? 'bg-green-500' :
                      factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}