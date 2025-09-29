import { motion } from 'motion/react';
import { AnimatedBarChart } from '../components/dashboard/AnimatedBarChart';
import { AnimatedPieChart } from '../components/dashboard/AnimatedPieChart';

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function RelatoriosPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
          Relatórios
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análises detalhadas e insights financeiros
        </p>
      </motion.div>

      {/* Charts Row */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-2 gap-8"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatedBarChart />
        <AnimatedPieChart />
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={contentVariants}
        className="text-center p-12 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📈</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Relatórios Avançados
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Visualize gráficos detalhados, exporte dados e obtenha insights sobre seus hábitos financeiros.
        </p>
      </motion.div>
    </motion.div>
  );
}