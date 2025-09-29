import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, Target, Shield, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi } from '../../services/dashboardApi';
import { budgetApi } from '../../services/budgetApi';
import { Button } from '../ui/button';
import { DashboardData } from '../../types/dashboard';
import { Budget } from '../../types/budget';

interface SpendingAlert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'unusual_spending' | 'daily_limit' | 'category_spike';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  amount?: number;
  limit?: number;
  percentage?: number;
  dismissible: boolean;
}

interface SpendingAlertsWidgetProps {
  className?: string;
  dashboardData?: DashboardData | null;
}

export function SpendingAlertsWidget({ className = '', dashboardData }: SpendingAlertsWidgetProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id && dashboardData) {
      generateAlerts();
    }
  }, [user?.id, dashboardData]);

  const generateAlerts = async () => {
    if (!user?.id || !dashboardData) return;

    try {
      setIsLoading(true);
      const newAlerts: SpendingAlert[] = [];

      // Get budget data for budget alerts
      const budgets = await budgetApi.getBudgets(user.id);

      // 1. Budget alerts
      budgets.forEach((budget: Budget) => {
        const percentage = budget.valor_limite > 0 ? (budget.valor_gasto / budget.valor_limite) * 100 : 0;

        if (percentage >= 100) {
          newAlerts.push({
            id: `budget_exceeded_${budget.id}`,
            type: 'budget_exceeded',
            title: 'Orçamento Ultrapassado',
            message: `${budget.nome} ultrapassou ${percentage.toFixed(0)}% do limite`,
            severity: 'critical',
            category: budget.categoria?.nome,
            amount: budget.valor_gasto,
            limit: budget.valor_limite,
            percentage: Math.round(percentage),
            dismissible: true
          });
        } else if (percentage >= 80) {
          newAlerts.push({
            id: `budget_warning_${budget.id}`,
            type: 'budget_warning',
            title: 'Orçamento Próximo do Limite',
            message: `${budget.nome} atingiu ${percentage.toFixed(0)}% do limite`,
            severity: percentage >= 95 ? 'high' : 'medium',
            category: budget.categoria?.nome,
            amount: budget.valor_gasto,
            limit: budget.valor_limite,
            percentage: Math.round(percentage),
            dismissible: true
          });
        }
      });

      // 2. Category spending spike alert
      const sortedCategories = dashboardData.gastos_por_categoria
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

      if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const totalSpending = dashboardData.resumo.total_despesas;
        const categoryPercentage = totalSpending > 0 ? (topCategory.valor / totalSpending) * 100 : 0;

        if (categoryPercentage > 40) {
          newAlerts.push({
            id: `category_spike_${topCategory.categoria}`,
            type: 'category_spike',
            title: 'Alto Gasto em Categoria',
            message: `${topCategory.categoria} representa ${categoryPercentage.toFixed(0)}% dos gastos`,
            severity: categoryPercentage > 60 ? 'high' : 'medium',
            category: topCategory.categoria,
            amount: topCategory.valor,
            percentage: Math.round(categoryPercentage),
            dismissible: true
          });
        }
      }

      // 3. Unusual spending pattern
      const avgDailySpending = dashboardData.evolucao_diaria.length > 0
        ? dashboardData.resumo.total_despesas / dashboardData.evolucao_diaria.length
        : 0;

      const recentDays = dashboardData.evolucao_diaria.slice(-3);
      const recentAvg = recentDays.length > 0
        ? recentDays.reduce((sum, day) => sum + day.despesas, 0) / recentDays.length
        : 0;

      if (avgDailySpending > 0 && recentAvg > avgDailySpending * 1.5) {
        newAlerts.push({
          id: 'unusual_spending',
          type: 'unusual_spending',
          title: 'Gastos Acima do Normal',
          message: `Gastos recentes 50% acima da média diária`,
          severity: 'medium',
          amount: recentAvg,
          dismissible: true
        });
      }

      // 4. Positive alerts (encouragement)
      if (dashboardData.resumo.saldo > 0 && newAlerts.length === 0) {
        newAlerts.push({
          id: 'positive_balance',
          type: 'daily_limit',
          title: 'Parabéns! 🎉',
          message: `Saldo positivo de ${dashboardApi.formatCurrency(dashboardData.resumo.saldo)}`,
          severity: 'low',
          amount: dashboardData.resumo.saldo,
          dismissible: false
        });
      }

      // Filter out dismissed alerts
      const activeAlerts = newAlerts.filter(alert => !dismissedAlerts.has(alert.id));
      setAlerts(activeAlerts);

    } catch (error) {
      console.error('Error generating spending alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-red-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  const getSeverityIcon = (type: string, severity: string) => {
    if (severity === 'low') return CheckCircle;

    switch (type) {
      case 'budget_exceeded':
      case 'budget_warning':
        return Target;
      case 'unusual_spending':
      case 'category_spike':
        return TrendingUp;
      default:
        return AlertTriangle;
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-xl">
                <div className="w-40 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="w-64 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tudo Sob Controle
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum alerta de gastos no momento
          </p>
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Alertas de Gastos
        </h3>
        <div className={`p-2 bg-gradient-to-br ${
          alerts.some(a => a.severity === 'critical') ? 'from-red-500 to-red-600' :
          alerts.some(a => a.severity === 'high') ? 'from-orange-500 to-red-500' :
          'from-blue-500 to-indigo-600'
        } rounded-xl relative`}>
          <AlertTriangle className="w-5 h-5 text-white" />
          {alerts.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{alerts.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = getSeverityIcon(alert.type, alert.severity);

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`p-4 rounded-2xl border transition-all duration-200 ${getSeverityBg(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getSeverityColor(alert.severity)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.amount && (
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {dashboardApi.formatCurrency(alert.amount)}
                        </span>
                        {alert.percentage && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          }`}>
                            {alert.percentage}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {alert.dismissible && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissAlert(alert.id)}
                    className="w-6 h-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 ml-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Monitoramento ativo</span>
          <span>
            {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} crítico{alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
}