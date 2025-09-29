import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { budgetApi } from '../../services/budgetApi';
import { useAuth } from '../../contexts/AuthContext';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

interface BudgetPerformanceData {
  percentualDentroMeta: number;
  economiaMensal: number;
  totalOrcamentos: number;
  orcamentosCriticos: number;
  dicaInteligente: string;
  categoriaProblema: string | null;
}

interface BudgetPerformanceWidgetProps {
  className?: string;
}

export function BudgetPerformanceWidget({ className = '' }: BudgetPerformanceWidgetProps) {
  const { user } = useAuth();
  const { data: dashboardData } = useEnhancedDashboard();
  const [performanceData, setPerformanceData] = useState<BudgetPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPerformanceData();
    }
  }, [user?.id, dashboardData]);

  const loadPerformanceData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get budget summaries
      const budgetSummaries = await budgetApi.getBudgetSummaries(user.id);
      console.log('Budget summaries for performance:', budgetSummaries);

      if (!budgetSummaries || budgetSummaries.length === 0) {
        setPerformanceData({
          percentualDentroMeta: 0,
          economiaMensal: 0,
          totalOrcamentos: 0,
          orcamentosCriticos: 0,
          dicaInteligente: 'Crie seus primeiros orçamentos para começar a monitorar performance',
          categoriaProblema: null
        });
        return;
      }

      // Calculate performance metrics
      const totalOrcamentos = budgetSummaries.length;
      let orcamentosDentroMeta = 0;
      let totalLimite = 0;
      let totalGasto = 0;
      let orcamentosCriticos = 0;
      let maiorDesvio = { valor: 0, categoria: '', percentual: 0 };

      budgetSummaries.forEach((budget: any) => {
        const limite = Number(budget.valor_limite) || 0;
        const gasto = Number(budget.valor_gasto) || 0;
        const percentual = limite > 0 ? (gasto / limite) * 100 : 0;

        totalLimite += limite;
        totalGasto += gasto;

        // Budget dentro da meta (até 100%)
        if (percentual <= 100) {
          orcamentosDentroMeta++;
        }

        // Budgets críticos (acima de 80%)
        if (percentual >= 80) {
          orcamentosCriticos++;
        }

        // Encontrar maior desvio
        if (percentual > 100) {
          const desvio = gasto - limite;
          if (desvio > maiorDesvio.valor) {
            maiorDesvio = {
              valor: desvio,
              categoria: budget.categoria || budget.nome || 'Sem nome',
              percentual: percentual
            };
          }
        }
      });

      const percentualDentroMeta = totalOrcamentos > 0
        ? Math.round((orcamentosDentroMeta / totalOrcamentos) * 100)
        : 0;

      const economiaMensal = totalLimite - totalGasto;

      // Generate smart tip
      let dicaInteligente = '';
      let categoriaProblema = null;

      if (maiorDesvio.valor > 0) {
        categoriaProblema = maiorDesvio.categoria;
        dicaInteligente = `Considere revisar o orçamento de "${maiorDesvio.categoria}" - está ${Math.round(maiorDesvio.percentual - 100)}% acima do planejado.`;
      } else if (orcamentosCriticos > 0) {
        dicaInteligente = `${orcamentosCriticos} orçamento(s) próximo(s) do limite. Monitore os gastos nas próximas semanas.`;
      } else {
        dicaInteligente = 'Parabéns! Todos os orçamentos estão dentro da meta. Continue assim!';
      }

      setPerformanceData({
        percentualDentroMeta,
        economiaMensal,
        totalOrcamentos,
        orcamentosCriticos,
        dicaInteligente,
        categoriaProblema
      });

    } catch (err: any) {
      console.error('Error loading budget performance:', err);
      setError(err.message || 'Erro ao carregar performance dos orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: numValue >= 1000 ? 0 : 2
    }).format(numValue);
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-48 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
              <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
            </div>
            <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
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
          <p className="text-sm text-red-600 dark:text-red-400">Erro ao carregar performance</p>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  const getPerformanceIcon = () => {
    if (performanceData.percentualDentroMeta >= 80) return CheckCircle;
    if (performanceData.percentualDentroMeta >= 60) return TrendingUp;
    return AlertTriangle;
  };

  const getPerformanceColor = () => {
    if (performanceData.percentualDentroMeta >= 80) return 'text-green-600 dark:text-green-400';
    if (performanceData.percentualDentroMeta >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTipColor = () => {
    if (performanceData.categoriaProblema) return 'from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20 border-red-200/50 dark:border-red-700/50';
    if (performanceData.orcamentosCriticos > 0) return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200/50 dark:border-yellow-700/50';
    return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50';
  };

  const getTipTextColor = () => {
    if (performanceData.categoriaProblema) return 'text-red-700 dark:text-red-300';
    if (performanceData.orcamentosCriticos > 0) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-green-700 dark:text-green-300';
  };

  const PerformanceIcon = getPerformanceIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📊 Performance do Orçamento
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Resumo de performance dos seus orçamentos no período
        </p>
      </div>

      <div className="space-y-4">
        {/* Budget Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200/50 dark:border-green-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <PerformanceIcon className={`w-5 h-5 mr-1 ${getPerformanceColor()}`} />
                <div className={`text-2xl font-bold ${getPerformanceColor()}`}>
                  {performanceData.percentualDentroMeta}%
                </div>
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                Orçamentos no Prazo
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 mr-1 text-blue-600 dark:text-blue-400" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(performanceData.economiaMensal)}
                </div>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {performanceData.economiaMensal >= 0 ? 'Economia Mensal' : 'Excesso de Gastos'}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Tip */}
        <div className={`bg-gradient-to-br ${getTipColor()} rounded-2xl p-4 border`}>
          <h4 className={`font-semibold mb-2 text-sm ${getTipTextColor()}`}>
            💡 Dica de Otimização
          </h4>
          <p className={`text-xs ${getTipTextColor()}`}>
            {performanceData.dicaInteligente}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Ajustar Orçamentos
          </button>
          <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
            Criar Meta
          </button>
        </div>
      </div>
    </motion.div>
  );
}