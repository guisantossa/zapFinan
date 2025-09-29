import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface ComparativeData {
  currentPeriod: {
    receitas: number;
    despesas: number;
    saldo: number;
    transacoes: number;
    topCategoria: string;
  };
  previousPeriod: {
    receitas: number;
    despesas: number;
    saldo: number;
    transacoes: number;
    topCategoria: string;
  };
  comparisons: {
    receitas: { valor: number; percentual: number; trend: 'up' | 'down' | 'stable' };
    despesas: { valor: number; percentual: number; trend: 'up' | 'down' | 'stable' };
    saldo: { valor: number; percentual: number; trend: 'up' | 'down' | 'stable' };
    transacoes: { valor: number; percentual: number; trend: 'up' | 'down' | 'stable' };
  };
}

interface ComparativeAnalysisWidgetProps {
  className?: string;
  currentData?: any;
}

export function ComparativeAnalysisWidget({ className = '', currentData }: ComparativeAnalysisWidgetProps) {
  const { user } = useAuth();
  const [comparativeData, setComparativeData] = useState<ComparativeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonType, setComparisonType] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (user?.id) {
      loadComparativeData();
    }
  }, [user?.id, comparisonType]);

  const loadComparativeData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

      if (comparisonType === 'month') {
        // Current month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Previous month
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        // Current year
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31);

        // Previous year
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
      }

      const [currentPeriodData, previousPeriodData] = await Promise.all([
        dashboardApi.getDashboardData(
          user.id,
          currentStart.toISOString().split('T')[0],
          currentEnd.toISOString().split('T')[0]
        ),
        dashboardApi.getDashboardData(
          user.id,
          previousStart.toISOString().split('T')[0],
          previousEnd.toISOString().split('T')[0]
        )
      ]);

      const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
        const diff = Math.abs(current - previous);
        const threshold = Math.max(current, previous) * 0.05; // 5% threshold

        if (diff < threshold) return 'stable';
        return current > previous ? 'up' : 'down';
      };

      const calculatePercentage = (current: number, previous: number): number => {
        return dashboardApi.safePercentage(current, previous, 0);
      };

      const current = {
        receitas: dashboardApi.safeNumber(currentPeriodData.resumo.total_receitas),
        despesas: dashboardApi.safeNumber(currentPeriodData.resumo.total_despesas),
        saldo: dashboardApi.safeNumber(currentPeriodData.resumo.saldo),
        transacoes: dashboardApi.safeNumber(currentPeriodData.transacoes_recentes?.length || 0),
        topCategoria: currentPeriodData.gastos_por_categoria?.[0]?.categoria || 'Nenhuma'
      };

      const previous = {
        receitas: dashboardApi.safeNumber(previousPeriodData.resumo.total_receitas),
        despesas: dashboardApi.safeNumber(previousPeriodData.resumo.total_despesas),
        saldo: dashboardApi.safeNumber(previousPeriodData.resumo.saldo),
        transacoes: dashboardApi.safeNumber(previousPeriodData.transacoes_recentes?.length || 0),
        topCategoria: previousPeriodData.gastos_por_categoria?.[0]?.categoria || 'Nenhuma'
      };

      setComparativeData({
        currentPeriod: current,
        previousPeriod: previous,
        comparisons: {
          receitas: {
            valor: current.receitas - previous.receitas,
            percentual: calculatePercentage(current.receitas, previous.receitas),
            trend: calculateTrend(current.receitas, previous.receitas)
          },
          despesas: {
            valor: current.despesas - previous.despesas,
            percentual: calculatePercentage(current.despesas, previous.despesas),
            trend: calculateTrend(current.despesas, previous.despesas)
          },
          saldo: {
            valor: current.saldo - previous.saldo,
            percentual: calculatePercentage(current.saldo, previous.saldo),
            trend: calculateTrend(current.saldo, previous.saldo)
          },
          transacoes: {
            valor: current.transacoes - previous.transacoes,
            percentual: calculatePercentage(current.transacoes, previous.transacoes),
            trend: calculateTrend(current.transacoes, previous.transacoes)
          }
        }
      });

    } catch (err: any) {
      console.error('Error loading comparative data:', err);
      setError(err.message || 'Erro ao carregar dados comparativos');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'stable') return 'text-gray-500';

    if (isPositive) {
      return trend === 'up' ? 'text-green-500' : 'text-red-500';
    } else {
      return trend === 'up' ? 'text-red-500' : 'text-green-500';
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
            <div className="w-40 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
          <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Erro ao carregar análise comparativa</p>
          <Button variant="outline" size="sm" onClick={loadComparativeData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!comparativeData) return null;

  const metrics = [
    {
      key: 'receitas',
      label: 'Receitas',
      icon: TrendingUp,
      current: comparativeData.currentPeriod.receitas,
      comparison: comparativeData.comparisons.receitas,
      isPositive: true
    },
    {
      key: 'despesas',
      label: 'Despesas',
      icon: TrendingDown,
      current: comparativeData.currentPeriod.despesas,
      comparison: comparativeData.comparisons.despesas,
      isPositive: false
    },
    {
      key: 'saldo',
      label: 'Saldo',
      icon: BarChart3,
      current: comparativeData.currentPeriod.saldo,
      comparison: comparativeData.comparisons.saldo,
      isPositive: true
    },
    {
      key: 'transacoes',
      label: 'Transações',
      icon: Calendar,
      current: comparativeData.currentPeriod.transacoes,
      comparison: comparativeData.comparisons.transacoes,
      isPositive: true
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
          Análise Comparativa
        </h3>
        <div className="flex space-x-2">
          <Button
            variant={comparisonType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonType('month')}
            className="text-xs"
          >
            Mensal
          </Button>
          <Button
            variant={comparisonType === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonType('year')}
            className="text-xs"
          >
            Anual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const TrendIcon = getTrendIcon(metric.comparison.trend);
          const MetricIcon = metric.icon;

          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <MetricIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </span>
              </div>

              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {metric.key === 'transacoes' ? metric.current : formatCurrency(metric.current)}
                </p>

                <div className="flex items-center space-x-2 mt-1">
                  <TrendIcon className={`w-3 h-3 ${getTrendColor(metric.comparison.trend, metric.isPositive)}`} />
                  <span className={`text-xs font-medium ${getTrendColor(metric.comparison.trend, metric.isPositive)}`}>
                    {metric.comparison.trend === 'stable' ? 'Estável' :
                     `${dashboardApi.safeNumber(Math.abs(metric.comparison.percentual)).toFixed(1)}%`}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  vs {comparisonType === 'month' ? 'mês anterior' : 'ano anterior'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p className="mb-1">
            <span className="font-medium">Categoria principal atual:</span> {comparativeData.currentPeriod.topCategoria}
          </p>
          <p>
            <span className="font-medium">Categoria principal anterior:</span> {comparativeData.previousPeriod.topCategoria}
          </p>
        </div>
      </div>
    </motion.div>
  );
}