import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Wallet,
  PieChart
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { TransactionReport } from '../components/reports/TransactionReport';
import { BudgetReport } from '../components/reports/BudgetReport';
import { CategoryReport } from '../components/reports/CategoryReport';

export function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('transactions');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Relatórios Financeiros
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Análises detalhadas baseadas em dados reais • Filtros avançados • Exportação de dados
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8 overflow-x-auto">
              <TabsList className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 rounded-2xl shadow-lg min-w-fit">
                <TabsTrigger value="transactions" className="min-w-fit">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Transações</span>
                </TabsTrigger>
                <TabsTrigger value="budgets" className="min-w-fit">
                  <Wallet className="w-4 h-4 mr-2" />
                  <span>Orçamentos</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="min-w-fit">
                  <PieChart className="w-4 h-4 mr-2" />
                  <span>Categorias</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <TabsContent value="transactions">
              <TransactionReport />
            </TabsContent>

            <TabsContent value="budgets">
              <BudgetReport />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryReport />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Mobile Optimization Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-200/50 dark:border-blue-700/50 lg:hidden"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
              Relatórios Mobile Otimizados
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Todos os relatórios são otimizados para dispositivos móveis com filtros intuitivos e exportação fácil
            </p>
          </div>
        </motion.div>
      </motion.div>
  );
}