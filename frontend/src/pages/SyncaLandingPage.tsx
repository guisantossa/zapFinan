import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  DollarSign,
  MessageCircle,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/button';

export function SyncaLandingPage() {
  const features = [
    {
      icon: MessageCircle,
      title: 'Integração WhatsApp',
      description: 'Registre gastos direto pelo WhatsApp com comandos simples e intuitivos.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Automáticos',
      description: 'Receba relatórios detalhados sobre seus gastos mensais automaticamente.',
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados financeiros protegidos com criptografia de ponta a ponta.',
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Acesse de qualquer lugar, otimizado para dispositivos móveis.',
    },
  ];

  const plans = [
    {
      name: 'Essencial',
      price: 'R$ 9,90',
      period: '/mês',
      description: 'Organização individual',
      features: [
        'Transações ilimitadas',
        'Compromissos ilimitados',
        'Até 5 orçamentos',
        'Alertas via WhatsApp',
        'Resumo mensal (PDF)',
        'Acesso web ao histórico',
      ],
      cta: 'Começar Essencial',
      highlighted: false,
    },
    {
      name: 'Profissional',
      price: 'R$ 29,90',
      period: '/mês',
      description: 'Gestão total e insights',
      features: [
        'Transações ilimitadas',
        'Compromissos ilimitados',
        'Orçamentos ilimitados',
        'Alertas via WhatsApp',
        'Relatórios semanais e mensais (PDF/Excel)',
        'Acesso web completo',
        'Análise detalhada de gastos',
        'Gráficos e insights',
      ],
      cta: 'Mais Popular',
      highlighted: true,
    },
    {
      name: 'Supremo',
      price: 'R$ 439,90',
      period: '/mês',
      description: 'Família/Pequenos Negócios',
      features: [
        'Tudo do Profissional',
        'Relatórios diários',
        'Projeções financeiras',
        'Conta multiusuário (até 3 telefones)',
      ],
      cta: 'Começar Supremo',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
                Synca
              </h1>
            </motion.div>
            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-4"
            >
              <Link to="/auth/login">
                <Button variant="ghost">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]">
                  Começar Grátis
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent mb-6">
                Controle financeiro
                <br />
                via WhatsApp
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
                Registre gastos, receba relatórios e gerencie seu orçamento diretamente pelo WhatsApp.
                Simples, rápido e seguro.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Link to="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] text-lg px-8 py-4">
                  Começar Grátis
                  <Zap className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Já tenho conta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-center space-x-8 text-gray-500 dark:text-gray-400"
            >
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm">5.0 de satisfação</span>
              </div>
              <div className="text-sm">
                <strong>1000+</strong> usuários ativos
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Por que escolher o Synca?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Uma solução completa para gestão financeira pessoal integrada ao WhatsApp
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comece grátis e escale conforme sua necessidade
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-8 rounded-3xl border-2 ${
                  plan.highlighted
                    ? 'border-[#3B82F6] bg-gradient-to-br from-[#1E3A8A]/5 to-[#3B82F6]/5'
                    : 'border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-slate-800'
                } relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white px-4 py-2 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth/register">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para transformar sua gestão financeira?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Junte-se a milhares de usuários que já controlam suas finanças pelo WhatsApp
            </p>
            <Link to="/auth/register">
              <Button size="lg" className="bg-white text-[#1E3A8A] hover:bg-gray-100 text-lg px-8 py-4">
                Começar Agora - É Grátis!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
                Synca
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 Synca. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
