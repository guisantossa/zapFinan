import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertCircle, CheckCircle, Infinity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { plansApi, UsageSummary } from '../../services/plansApi';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function UsageSummaryCard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setIsLoading(true);
      const data = await plansApi.getUsageSummary();
      setUsage(data);
    } catch (error) {
      console.error('Erro ao carregar uso:', error);
      toast.error('Erro ao carregar informações de uso');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!usage || !usage.has_plan) {
    return (
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum plano ativo
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Assine um plano para começar a usar todos os recursos
          </p>
          <Link
            to="/dashboard/planos"
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            Ver Planos
          </Link>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      label: 'Transações este mês',
      current: usage.usage.transactions_this_month,
      limit: usage.limits.max_transactions_per_month,
      key: 'max_transactions_per_month'
    },
    {
      label: 'Orçamentos',
      current: usage.usage.budgets,
      limit: usage.limits.max_budgets,
      key: 'max_budgets'
    },
    {
      label: 'Compromissos',
      current: usage.usage.commitments,
      limit: usage.limits.max_commitments,
      key: 'max_commitments'
    },
    {
      label: 'Telefones',
      current: usage.usage.phones,
      limit: usage.limits.max_phones,
      key: 'max_phones'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Uso do Plano
            </CardTitle>
            <CardDescription>
              Plano: <span className="font-semibold">{usage.plan_name}</span>
            </CardDescription>
          </div>
          <Link to="/dashboard/planos">
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer">
              Ver Planos
            </Badge>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Warnings */}
        {usage.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Atenção aos limites
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {usage.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Usage Items */}
        <div className="space-y-4">
          {usageItems.map((item, index) => {
            const percentage = usage.percentages[item.key] || 0;
            const isUnlimited = item.limit === null;
            const isNearLimit = percentage >= 75;
            const colorClass = plansApi.getUsageColor(percentage);

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.label}
                  </span>
                  <span className={`font-semibold ${colorClass}`}>
                    {item.current} / {isUnlimited ? (
                      <span className="inline-flex items-center gap-1">
                        <Infinity className="w-4 h-4" />
                      </span>
                    ) : item.limit}
                  </span>
                </div>

                {!isUnlimited && (
                  <div className="relative">
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorClassName={
                        percentage >= 90
                          ? 'bg-red-500'
                          : percentage >= 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }
                    />
                    {isNearLimit && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>{percentage.toFixed(0)}% usado</span>
                      </div>
                    )}
                  </div>
                )}

                {isUnlimited && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Uso ilimitado</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Data Retention Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Histórico de dados: {usage.limits.data_retention_months} meses
          </p>
        </div>
      </CardContent>
    </Card>
  );
}