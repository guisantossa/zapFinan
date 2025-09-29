import { PiggyBank, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { BudgetStats } from '../../types/budget';

interface PremiumSummaryCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red';
  trend?: { value: string; isPositive: boolean };
  delay?: number;
}

function PremiumSummaryCard({ title, value, icon: Icon, color, trend, delay = 0 }: PremiumSummaryCardProps) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/50 dark:border-blue-800/50'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      icon: 'text-green-600 dark:text-green-400',
      border: 'border-green-200/50 dark:border-green-800/50'
    },
    yellow: {
      bg: 'from-yellow-500 to-yellow-600',
      light: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200/50 dark:border-yellow-800/50'
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-200/50 dark:border-red-800/50'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      whileHover={{
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="group relative overflow-hidden"
    >
      {/* Glass Card */}
      <div className={`relative p-6 rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border ${colors.border} hover:shadow-2xl transition-all duration-500`}>
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.light} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

        {/* Decorative elements */}
        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors.bg} opacity-10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500`} />

        <div className="relative z-10">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.bg} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>

            {trend && (
              <div className={`flex items-center space-x-1 text-sm ${
                trend.isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className={`w-4 h-4 ${
                  trend.isPositive ? '' : 'rotate-180'
                }`} />
                <span className="font-medium">{trend.value}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface BudgetSummaryCardsProps {
  stats: BudgetStats;
  isLoading?: boolean;
}

export function BudgetSummaryCards({ stats, isLoading }: BudgetSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="p-6 rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse"
          >
            <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    // Verificar se o valor é um número válido
    if (isNaN(value) || value === null || value === undefined) {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <PremiumSummaryCard
        title="Total de Orçamentos"
        value={stats.total_budgets.toString()}
        icon={PiggyBank}
        color="blue"
        delay={0}
      />

      <PremiumSummaryCard
        title="Orçamentos Ativos"
        value={stats.active_budgets.toString()}
        icon={Target}
        color="green"
        trend={{
          value: `${stats.active_budgets}/${stats.total_budgets}`,
          isPositive: stats.active_budgets > 0
        }}
        delay={0.1}
      />

      <PremiumSummaryCard
        title="Próximos ao Limite"
        value={stats.budgets_near_limit.toString()}
        icon={AlertTriangle}
        color="yellow"
        trend={{
          value: `${Math.round((stats.budgets_near_limit / Math.max(stats.total_budgets, 1)) * 100)}%`,
          isPositive: false
        }}
        delay={0.2}
      />

      <PremiumSummaryCard
        title="Valor Total Alocado"
        value={formatCurrency(stats.total_allocated)}
        icon={TrendingUp}
        color="blue"
        trend={{
          value: `${Math.round((stats.total_spent / Math.max(stats.total_allocated, 1)) * 100)}% gasto`,
          isPositive: stats.total_spent < stats.total_allocated
        }}
        delay={0.3}
      />
    </div>
  );
}