import { motion } from 'motion/react';
import { InteractiveReportsWidget } from '../InteractiveReportsWidget';
import { AdvancedDataExportWidget } from '../AdvancedDataExportWidget';

interface ReportsTabProps {
  data: any;
  isLoading: boolean;
}

export function ReportsTab({ data, isLoading }: ReportsTabProps) {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          📈 Relatórios & Exportação
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Gere relatórios personalizados e exporte seus dados em diferentes formatos
        </p>
      </motion.div>

      {/* Main Widgets Grid */}
      <div className="space-y-8">
        {/* Interactive Reports - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <InteractiveReportsWidget dashboardData={data} />
        </motion.div>

        {/* Advanced Data Export - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AdvancedDataExportWidget dashboardData={data} />
        </motion.div>

        {/* Report Templates Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-700/50"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              📋 Modelos de Relatório
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Templates pré-configurados para diferentes necessidades de relatório
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Template Card 1 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Relatório Mensal
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Resumo completo
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Visão geral das finanças do mês com análises de receitas, despesas e tendências.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Mais utilizado
                </span>
                <button className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            {/* Template Card 2 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Análise de Categorias
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Detalhamento por tipo
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Breakdown detalhado de gastos por categoria com comparações e insights.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Recomendado
                </span>
                <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                  Usar Template
                </button>
              </div>
            </div>

            {/* Template Card 3 */}
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform duration-200 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Projeção Anual
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Previsões futuras
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Projeções baseadas em tendências históricas e cenários futuros.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Avançado
                </span>
                <button className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  Usar Template
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {/* Scheduled Reports */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                📅 Relatórios Agendados
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Configure relatórios automáticos enviados por email
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm">📊</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      Mensal - Dia 1
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Próximo: 01/02/2025
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-green-600 dark:text-green-400">Ativo</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm">📈</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      Semanal - Sexta
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Próximo: 31/01/2025
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pausado</span>
                </div>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm">
              + Novo Agendamento
            </button>
          </div>

          {/* Export History */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                📥 Histórico de Exportações
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Acesse seus relatórios exportados recentemente
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm">📑</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      relatorio_janeiro_2025.pdf
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Hoje às 14:30
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-medium">
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm">📊</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      dados_categorias.xlsx
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Ontem às 09:15
                    </div>
                  </div>
                </div>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-medium">
                  Download
                </button>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-white/60 dark:bg-slate-700/60 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 text-sm border border-gray-200/50 dark:border-gray-600/50">
              Ver Todos os Arquivos
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}