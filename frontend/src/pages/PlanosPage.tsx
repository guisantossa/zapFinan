import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { plansApi, PlanWithFeatures } from '../services/plansApi';
import { toast } from 'sonner';

export default function PlanosPage() {
  const [plans, setPlans] = useState<PlanWithFeatures[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await plansApi.getActivePlans();
      setPlans(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (index: number) => {
    const icons = [Sparkles, Zap, Crown];
    return icons[index] || Sparkles;
  };

  const getFeaturesList = (plan: PlanWithFeatures) => {
    const features = [];

    // Transactions
    if (plan.transactions_enabled) {
      const limit = plan.max_transactions_per_month;
      features.push({
        name: limit ? `${limit} transações/mês` : 'Transações ilimitadas',
        included: true
      });
    }

    // Budgets
    if (plan.budgets_enabled) {
      const limit = plan.max_budgets;
      features.push({
        name: limit ? `Até ${limit} orçamentos` : 'Orçamentos ilimitados',
        included: true
      });
    }

    // Commitments
    if (plan.commitments_enabled) {
      const limit = plan.max_commitments;
      features.push({
        name: limit ? `Até ${limit} compromissos` : 'Compromissos ilimitados',
        included: true
      });
    }

    // Phones
    const phoneLimit = plan.max_phones;
    features.push({
      name: phoneLimit ? `${phoneLimit} telefone${phoneLimit > 1 ? 's' : ''}` : 'Telefones ilimitados',
      included: true
    });

    // Advanced features
    features.push({
      name: 'Relatórios avançados',
      included: plan.reports_advanced
    });

    features.push({
      name: 'Sincronização Google Calendar',
      included: plan.google_calendar_sync
    });

    features.push({
      name: 'Acesso à API',
      included: plan.api_access
    });

    features.push({
      name: 'Suporte prioritário',
      included: plan.priority_support
    });

    // Data retention
    features.push({
      name: `${plan.data_retention_months} meses de histórico`,
      included: true
    });

    return features;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Gerencie suas finanças com inteligência
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
              billingPeriod === 'annual'
                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Anual
            <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
              Economize
            </Badge>
          </button>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => {
          const Icon = getPlanIcon(index);
          const features = getFeaturesList(plan);
          const price = billingPeriod === 'monthly' ? plan.valor_mensal : plan.valor_anual / 12;
          const savings = plansApi.calculateAnnualSavings(plan);
          const isPopular = index === 1; // Middle plan is usually popular

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={isPopular ? 'lg:-mt-4' : ''}
            >
              <Card className={`relative h-full ${
                isPopular
                  ? 'border-2 border-blue-500 shadow-2xl'
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br ${plansApi.getPlanColor(plan.color)} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.nome}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.description || 'Plano completo para suas necessidades'}
                  </CardDescription>

                  <div className="mt-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {plansApi.formatCurrency(price)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/mês</span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        Economize {plansApi.formatCurrency(savings.savings)}/ano (
                        {savings.percentage.toFixed(0)}%)
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                    }`}
                    onClick={() => toast.info('Integração com pagamento em breve!')}
                  >
                    Assinar {plan.nome}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Todos os planos incluem atualizações gratuitas e suporte técnico.
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Cancele a qualquer momento, sem taxas ou multas.
        </p>
      </motion.div>
    </div>
  );
}