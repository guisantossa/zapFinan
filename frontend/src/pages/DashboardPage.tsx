import { useState } from 'react';
import { motion } from 'motion/react';
import {
  RefreshCw,
  AlertCircle,
  BarChart3,
  Wallet,
  Brain
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { PeriodFilter } from '../components/dashboard/PeriodFilter';
import { OverviewTab } from '../components/dashboard/tabs/OverviewTab';
import { BudgetsTab } from '../components/dashboard/tabs/BudgetsTab';
import { AnalyticsTab } from '../components/dashboard/tabs/AnalyticsTab';
import { useEnhancedDashboard } from '../hooks/useEnhancedDashboard';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    data,
    stats,
    comparativo,
    isLoading,
    error,
    enhancedStats,
    budgets,
    upcomingCommitments,
    refreshAll,
    currentPeriod,
    customDates,
    setPeriod,
    setCustomPeriod
  } = useEnhancedDashboard();

  const handleRefresh = async () => {
    try {
      await refreshAll();
      toast.success('Dashboard atualizado!');
    } catch (err) {
      toast.error('Erro ao atualizar dashboard');
    }
  };

  return (
    <div>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-8"
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
                Dashboard Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {data ? `${data.mes_referencia} • Acompanhe suas métricas em tempo real` : 'Carregando dados...'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {error && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Erro ao carregar</span>
                </div>
              )}

              <PeriodFilter
                currentPeriod={currentPeriod}
                customDates={customDates}
                onPeriodChange={setPeriod}
                onCustomPeriodChange={setCustomPeriod}
                isLoading={isLoading}
              />

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
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
                <TabsTrigger value="overview" className="min-w-fit">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span>Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="budgets" className="min-w-fit">
                  <Wallet className="w-4 h-4 mr-2" />
                  <span>Orçamentos</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="min-w-fit">
                  <Brain className="w-4 h-4 mr-2" />
                  <span>Análises</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Contents */}
            <TabsContent value="overview">
              <OverviewTab
                data={data}
                comparativo={comparativo}
                enhancedStats={enhancedStats}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="budgets">
              <BudgetsTab data={data} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsTab data={data} isLoading={isLoading} />
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
            <div className="text-2xl mb-2">📱</div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
              Experiência Mobile Otimizada
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Este dashboard foi otimizado para dispositivos móveis com navegação touch-friendly e layouts responsivos
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
