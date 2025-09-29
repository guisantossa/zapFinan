import { motion } from 'motion/react';
import { BudgetStatusWidget } from '../BudgetStatusWidget';
import { BudgetPerformanceWidget } from '../BudgetPerformanceWidget';
import { UpcomingCommitmentsWidget } from '../UpcomingCommitmentsWidget';
import { SpendingAlertsWidget } from '../SpendingAlertsWidget';
import { CategoryRanking } from '../CategoryRanking';

interface BudgetsTabProps {
  data: any;
  isLoading: boolean;
}

export function BudgetsTab({ data, isLoading }: BudgetsTabProps) {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
          💰 Gestão de Orçamentos
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitore seus orçamentos, compromissos futuros e alertas de gastos
        </p>
      </motion.div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <BudgetStatusWidget />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <UpcomingCommitmentsWidget />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <SpendingAlertsWidget dashboardData={data} />
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Analysis */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <CategoryRanking />
        </motion.div>

        {/* Budget Performance Widget - Real API Data */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <BudgetPerformanceWidget />
        </motion.div>
      </div>

      {/* Budget Planning Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200/50 dark:border-indigo-700/50"
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🎯 Planejamento Orçamentário
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Ferramentas para otimizar seu planejamento financeiro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📈</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Análise de Tendências
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Identifique padrões de gastos
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Metas Inteligentes
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Defina objetivos realizáveis
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔔</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Alertas Personalizados
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Seja notificado de mudanças
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}