import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard } from 'lucide-react';
import { useTransactionStats } from '../../hooks/useTransactionStats';
import { cn } from '../ui/utils';

interface TransactionStatsProps {
  dateRange?: {
    data_inicio?: string;
    data_fim?: string;
  };
  className?: string;
}

export function TransactionStats({ dateRange, className }: TransactionStatsProps) {
  const { stats, loading, error } = useTransactionStats(dateRange);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={cn("text-center p-8", className)}>
        <p className="text-gray-500 dark:text-gray-400">
          {error || 'Não foi possível carregar as estatísticas'}
        </p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Receitas',
      value: stats.total_receitas_formatted,
      count: stats.receitas,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Despesas',
      value: stats.total_despesas_formatted,
      count: stats.despesas,
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Saldo',
      value: stats.saldo_formatted,
      count: stats.receitas + stats.despesas,
      icon: DollarSign,
      color: stats.saldo >= 0
        ? 'from-blue-500 to-indigo-600'
        : 'from-red-500 to-rose-600',
      bgColor: stats.saldo >= 0
        ? 'bg-blue-50 dark:bg-blue-900/20'
        : 'bg-red-50 dark:bg-red-900/20',
      textColor: stats.saldo >= 0
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {statsCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-slate-800/50" />

            {/* Content */}
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  card.bgColor
                )}>
                  <Icon className={cn("w-6 h-6", card.textColor)} />
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.count} transações
                  </p>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {card.title}
              </h3>

              {/* Value */}
              <div className="flex items-baseline">
                <span className={cn(
                  "text-2xl font-bold",
                  card.textColor
                )}>
                  {card.value}
                </span>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-transparent via-white to-transparent" />
          </motion.div>
        );
      })}
    </div>
  );
}