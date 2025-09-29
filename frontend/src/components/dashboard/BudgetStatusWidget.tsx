import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PiggyBank, AlertTriangle, CheckCircle, TrendingUp, Plus } from 'lucide-react';
import { budgetApi } from '../../services/budgetApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Budget } from '../../types/budget';

interface BudgetSummary {
  id: number;
  nome: string;
  categoria: string;
  valor_limite: number;
  valor_gasto: number;
  percentual_usado: number;
  status: 'safe' | 'warning' | 'danger';
}

interface BudgetStatusWidgetProps {
  className?: string;
}

export function BudgetStatusWidget({ className = '' }: BudgetStatusWidgetProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadBudgetSummary();
    }
  }, [user?.id]);

  const loadBudgetSummary = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get budget summaries that should include spending calculations
      const budgetSummaries = await budgetApi.getBudgetSummaries(user.id);
      console.log('Budget summaries from API:', budgetSummaries);

      // Transform summaries into display format
      const budgetSummary = budgetSummaries.map((summary: any) => {
        // Ensure values are numbers and not null/undefined
        const valorLimite = Number(summary.valor_limite) || 0;
        const valorGasto = Number(summary.valor_gasto) || 0;

        const percentual = valorLimite > 0 ? (valorGasto / valorLimite) * 100 : 0;

        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (percentual >= 100) status = 'danger';
        else if (percentual >= 80) status = 'warning';

        return {
          id: summary.id,
          nome: summary.nome,
          categoria: summary.categoria || 'Sem categoria',
          valor_limite: valorLimite,
          valor_gasto: valorGasto,
          percentual_usado: Math.round(percentual) || 0,
          status
        };
      });

      // Sort by percentage (highest first) and limit to top 4
      budgetSummary.sort((a, b) => b.percentual_usado - a.percentual_usado);
      setBudgets(budgetSummary.slice(0, 4));

    } catch (err: any) {
      console.error('Error loading budget summary:', err);
      setError(err.message || 'Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'from-red-500 to-red-600';
      case 'warning': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'danger': return AlertTriangle;
      case 'warning': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const formatCurrency = (value: number) => {
    // Handle NaN, null, undefined values
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
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
          <p className="text-sm text-red-600 dark:text-red-400">Erro ao carregar orçamentos</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadBudgetSummary}
            className="mt-3"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <PiggyBank className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum Orçamento
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Crie orçamentos para controlar seus gastos
          </p>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Criar Orçamento
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
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Status dos Orçamentos
        </h3>
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
          <PiggyBank className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="space-y-5">
        {budgets.map((budget, index) => {
          const StatusIcon = getStatusIcon(budget.status);

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`w-4 h-4 ${
                    budget.status === 'danger' ? 'text-red-500' :
                    budget.status === 'warning' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {budget.nome}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  budget.status === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                  budget.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {budget.percentual_usado}%
                </span>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.percentual_usado, 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getStatusColor(budget.status)}`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(budget.valor_gasto)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(budget.valor_limite)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {budgets.filter(b => b.status === 'safe').length} dentro da meta
          </span>
          <span>
            {budgets.filter(b => b.status === 'danger').length} ultrapassaram
          </span>
        </div>
      </div>
    </motion.div>
  );
}