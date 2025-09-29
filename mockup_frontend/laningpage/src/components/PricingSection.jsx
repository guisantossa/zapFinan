import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const plans = [
  {
    name: 'Essencial',
    price: 'R$ 9,90',
    period: '/mês',
    features: [
      'Registros via WhatsApp',
      'Acesso Web Básico',
      '1 Orçamento',
      'Suporte por email'
    ],
    popular: false
  },
  {
    name: 'Profissional',
    price: 'R$ 29,90',
    period: '/mês',
    features: [
      'Tudo do Essencial',
      'Orçamentos Ilimitados',
      'Acesso Web Completo',
      'Relatórios Avançados',
      'Alertas Preditivos',
      'Suporte Prioritário'
    ],
    popular: true
  },
  {
    name: 'Supremo',
    price: 'R$ 49,90',
    period: '/mês',
    features: [
      'Tudo do Profissional',
      'Conta Multi-Usuário (Até 3)',
      'Sincronização de Calendário',
      'Consultor Dedicado',
      'Suporte 24/7'
    ],
    popular: false
  }
];

const PricingSection = () => {
  const { toast } = useToast();

  const handleSelectPlan = (planName) => {
    toast({
      title: `Plano ${planName} selecionado!`,
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la em seu próximo prompt! 🚀",
    });
  };

  return (
    <section id="planos" className="py-20 px-4 bg-[#f7f7f9] dark:bg-slate-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Controle Total, Preços Acessíveis.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Sem fidelidade. Cancele quando quiser. Comece com 7 dias grátis em qualquer plano.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-md transition-all duration-300 ${
                plan.popular ? 'scale-105 border-4 border-[#42a5f5] shadow-xl' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#1a237e] to-[#42a5f5] text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-[#1a237e] to-[#42a5f5] text-white hover:shadow-lg'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                }`}
              >
                Começar Teste Gratuito
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;