import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, TrendingUp, Calendar, DollarSign, Percent } from 'lucide-react';
import type { BudgetAlertInfo } from '../../types/transaction';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BudgetAlertDialogProps {
  alert: BudgetAlertInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetAlertDialog({ alert, isOpen, onClose }: BudgetAlertDialogProps) {
  if (!alert) return null;

  const isExceeded = alert.tipo_alerta === 'estouro';
  const percentualGasto = Math.round(alert.percentual_gasto);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Format period
  const getPeriodText = () => {
    const { periodicidade, mes, ano, quinzena, semana } = alert.periodo_info;

    if (periodicidade === 'mensal') {
      const data = new Date(ano, mes - 1, 1);
      return format(data, 'MMMM yyyy', { locale: ptBR });
    } else if (periodicidade === 'quinzenal') {
      return `${quinzena}ª quinzena de ${format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })}`;
    } else if (periodicidade === 'semanal') {
      return `${semana}ª semana de ${format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR })}`;
    }
    return '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              {/* Header with gradient */}
              <div className={`relative px-6 pt-6 pb-8 ${
                isExceeded
                  ? 'bg-gradient-to-br from-red-500 to-rose-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="flex items-start space-x-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  <div className="flex-1 pt-1">
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-2xl font-bold text-white mb-1"
                    >
                      {isExceeded ? '🚨 Orçamento Estourado!' : '⚠️ Atenção ao Orçamento'}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/90 text-sm"
                    >
                      {isExceeded
                        ? 'Você ultrapassou o limite do seu orçamento'
                        : `Você atingiu ${Math.round(alert.percentual_notificacao)}% do limite`}
                    </motion.p>
                  </div>
                </div>

                {/* Progress Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/90">
                      {percentualGasto}% utilizado
                    </span>
                    <span className="text-sm font-medium text-white/90">
                      {formatCurrency(alert.valor_gasto)} / {formatCurrency(alert.valor_limite)}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentualGasto, 100)}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-lg"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Budget Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Orçamento</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {alert.budget_nome}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Período</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {getPeriodText()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                      <Percent className="w-4 h-4" />
                      <span className="text-sm font-medium">Categoria</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {alert.categoria_nome}
                    </span>
                  </div>
                </motion.div>

                {/* Values Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Limite
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {formatCurrency(alert.valor_limite)}
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Gasto
                      </span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {formatCurrency(alert.valor_gasto)}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 col-span-2 border ${
                    isExceeded
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className={`w-4 h-4 ${
                        isExceeded
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isExceeded
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {isExceeded ? 'Valor Ultrapassado' : 'Disponível'}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${
                      isExceeded
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-green-900 dark:text-green-100'
                    }`}>
                      {formatCurrency(Math.abs(alert.valor_disponivel))}
                    </p>
                  </div>
                </motion.div>

                {/* Info Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className={`rounded-xl p-4 ${
                    isExceeded
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                  }`}>
                  <p className={`text-sm ${
                    isExceeded
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {isExceeded
                      ? '💡 Considere ajustar seus gastos ou revisar o limite do orçamento para o próximo período.'
                      : '💡 Você está próximo do limite. Acompanhe seus gastos para não ultrapassar o orçamento.'}
                  </p>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button
                  onClick={onClose}
                  className={`w-full rounded-xl h-12 font-semibold shadow-lg ${
                    isExceeded
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                  }`}
                >
                  Entendi
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
