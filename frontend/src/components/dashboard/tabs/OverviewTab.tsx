import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Target,
  Calendar,
  PiggyBank,
  AlertCircle
} from 'lucide-react';
import { PremiumSummaryCard } from '../PremiumSummaryCard';
import { BarChartCard } from '../BarChartCard';
import { PieChartCard } from '../PieChartCard';
import { ModernTransactionTable } from '../ModernTransactionTable';
import { CategoryRanking } from '../CategoryRanking';
import { dashboardApi } from '../../../services/dashboardApi';

interface OverviewTabProps {
  data: any;
  comparativo: any;
  enhancedStats: any;
  isLoading: boolean;
}

export function OverviewTab({ data, comparativo, enhancedStats, isLoading }: OverviewTabProps) {
  // Prepare summary data from real API data
  const summaryData = data ? [
    {
      title: "Receita Total",
      value: dashboardApi.formatCurrency(data.resumo.total_receitas),
      icon: DollarSign,
      color: "green" as const,
      trend: comparativo ? {
        value: `${Math.abs(comparativo.crescimento_receitas).toFixed(1)}%`,
        isPositive: comparativo.crescimento_receitas >= 0
      } : undefined
    },
    {
      title: "Despesas Totais",
      value: dashboardApi.formatCurrency(data.resumo.total_despesas),
      icon: TrendingDown,
      color: "red" as const,
      trend: comparativo ? {
        value: `${Math.abs(comparativo.crescimento_despesas).toFixed(1)}%`,
        isPositive: comparativo.crescimento_despesas <= 0
      } : undefined
    },
    {
      title: "Saldo",
      value: dashboardApi.formatCurrency(data.resumo.saldo),
      icon: data.resumo.saldo >= 0 ? TrendingUp : TrendingDown,
      color: data.resumo.saldo >= 0 ? "blue" : "red" as const,
      trend: comparativo ? {
        value: `${Math.abs(comparativo.crescimento_saldo).toFixed(1)}%`,
        isPositive: comparativo.crescimento_saldo >= 0
      } : undefined
    },
    {
      title: "Transações",
      value: data.transacoes_recentes.length.toString(),
      icon: CreditCard,
      color: "purple" as const,
      trend: {
        value: data.mes_referencia,
        isPositive: true
      }
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
            >
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                  <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </motion.div>
          ))
        ) : (
          summaryData.map((card, index) => (
            <PremiumSummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              trend={card.trend}
              delay={index * 0.1}
            />
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <BarChartCard />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <PieChartCard />
        </motion.div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${
              enhancedStats?.financialHealth === 'excellent' ? 'from-green-500 to-emerald-600' :
              enhancedStats?.financialHealth === 'good' ? 'from-blue-500 to-indigo-600' :
              enhancedStats?.financialHealth === 'fair' ? 'from-yellow-500 to-orange-500' :
              'from-red-500 to-red-600'
            } rounded-2xl`}>
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {enhancedStats?.budgetEfficiency || 0}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Eficiência Orçamentária
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {enhancedStats?.budgetsOnTrack || 0} de {enhancedStats?.totalBudgets || 0} na meta
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${
              (enhancedStats?.savingsRate || 0) > 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-red-600'
            } rounded-2xl`}>
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {enhancedStats?.savingsRate || 0}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Taxa de Poupança
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {(enhancedStats?.savingsRate || 0) > 0 ? 'Poupando dinheiro' : 'Gastando mais que ganha'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${
              (enhancedStats?.urgentCommitments || 0) > 0 ? 'from-red-500 to-red-600' : 'from-blue-500 to-indigo-600'
            } rounded-2xl relative`}>
              <Calendar className="w-6 h-6 text-white" />
              {(enhancedStats?.urgentCommitments || 0) > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {enhancedStats?.upcomingCommitments || 0}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Compromissos Próximos
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {enhancedStats?.urgentCommitments || 0} urgente{(enhancedStats?.urgentCommitments || 0) !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${
              enhancedStats?.financialHealth === 'excellent' ? 'from-green-500 to-emerald-600' :
              enhancedStats?.financialHealth === 'good' ? 'from-blue-500 to-indigo-600' :
              enhancedStats?.financialHealth === 'fair' ? 'from-yellow-500 to-orange-500' :
              'from-red-500 to-red-600'
            } rounded-2xl`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
              {enhancedStats?.financialHealth === 'excellent' ? '🌟' :
               enhancedStats?.financialHealth === 'good' ? '👍' :
               enhancedStats?.financialHealth === 'fair' ? '⚠️' : '🚨'}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Saúde Financeira
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 capitalize">
            {enhancedStats?.financialHealth === 'excellent' ? 'Excelente' :
             enhancedStats?.financialHealth === 'good' ? 'Boa' :
             enhancedStats?.financialHealth === 'fair' ? 'Razoável' : 'Precisa atenção'}
          </p>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction Table - takes 2 columns */}
        <div className="lg:col-span-2">
          <ModernTransactionTable />
        </div>

        {/* Category Ranking - takes 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <CategoryRanking />
        </motion.div>
      </div>
    </div>
  );
}