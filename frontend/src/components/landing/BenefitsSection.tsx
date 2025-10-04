import { motion } from 'motion/react';
import { Clock, Brain, Target, TrendingUp, Smartphone } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Recupere 4 Horas por Mês',
    description: 'Pare de perder tempo com planilhas complexas. Registre tudo em 5 segundos pelo WhatsApp.',
    isGameChanger: true,
  },
  {
    icon: Brain,
    title: 'Decisões Financeiras Mais Inteligentes',
    description: 'Veja exatamente para onde seu dinheiro está indo com categorização automática e relatórios claros.',
    isGameChanger: false,
  },
  {
    icon: Target,
    title: 'Atinja Suas Metas Sem Esforço',
    description: 'Crie orçamentos e receba alertas automáticos. Nunca mais estoure seu limite sem perceber.',
    isGameChanger: false,
  },
  {
    icon: TrendingUp,
    title: 'Economize em Média 30% ao Mês',
    description: 'Nossos usuários descobrem gastos desnecessários e economizam em média R$ 500/mês.',
    isGameChanger: false,
  },
  {
    icon: Smartphone,
    title: 'Tudo no App que Você Já Usa',
    description: 'Sem aprender ferramentas novas. Funciona 100% pelo WhatsApp que você usa todo dia.',
    isGameChanger: false,
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Transforme Sua Vida Financeira
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Não é só um app de finanças. É tempo de volta na sua vida e dinheiro no seu bolso.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 ${
                benefit.isGameChanger
                  ? 'bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white border-4 border-yellow-400 relative'
                  : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700'
              }`}
            >
              {benefit.isGameChanger && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-full font-bold text-sm">
                  🔥 GAME CHANGER
                </div>
              )}
              <div className="mb-6 flex justify-center">
                <benefit.icon
                  className={`w-12 h-12 ${
                    benefit.isGameChanger
                      ? 'text-yellow-300'
                      : 'text-[#3B82F6] dark:text-blue-400'
                  }`}
                />
              </div>
              <h3
                className={`text-xl font-bold mb-3 text-center ${
                  benefit.isGameChanger ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {benefit.title}
              </h3>
              <p
                className={`text-center ${
                  benefit.isGameChanger
                    ? 'text-blue-100'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA após benefícios */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Mais de <strong>1.000 pessoas</strong> já estão economizando tempo e dinheiro
          </p>
        </motion.div>
      </div>
    </section>
  );
}
