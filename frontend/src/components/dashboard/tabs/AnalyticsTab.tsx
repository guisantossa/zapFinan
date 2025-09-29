import { motion } from 'motion/react';
import { ComparativeAnalysisWidget } from '../ComparativeAnalysisWidget';
import { FinancialForecastWidget } from '../FinancialForecastWidget';
import { TrendAnalysisWidget } from '../TrendAnalysisWidget';
import { FinancialGoalsWidget } from '../FinancialGoalsWidget';

interface AnalyticsTabProps {
  data: any;
  isLoading: boolean;
}

export function AnalyticsTab({ data, isLoading }: AnalyticsTabProps) {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          🧠 Análises Avançadas
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Insights inteligentes, previsões e análises comparativas para decisões financeiras mais assertivas
        </p>
      </motion.div>

      <div className="space-y-8">
        {/* Row 1: Comparative Analysis and Financial Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ComparativeAnalysisWidget currentData={data} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <FinancialForecastWidget dashboardData={data} />
          </motion.div>
        </div>

        {/* Row 2: Trend Analysis - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <TrendAnalysisWidget dashboardData={data} />
        </motion.div>

        {/* Row 3: Financial Goals - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <FinancialGoalsWidget dashboardData={data} />
        </motion.div>


      </div>
    </div>
  );
}