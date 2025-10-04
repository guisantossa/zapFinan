import { motion } from 'motion/react';
import { MessageSquare, Sparkles, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    number: '1',
    title: 'Mande uma Mensagem',
    description: 'Digite no WhatsApp: "Gastei R$ 50 no mercado" e pronto!',
  },
  {
    icon: Sparkles,
    number: '2',
    title: 'IA Categoriza Automaticamente',
    description: 'Nossa inteligência artificial classifica e organiza tudo para você.',
  },
  {
    icon: BarChart3,
    number: '3',
    title: 'Veja Seus Insights',
    description: 'Receba relatórios automáticos e saiba exatamente onde está seu dinheiro.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-900">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Como Funciona?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tão simples que você vai usar todo dia sem nem perceber
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center relative"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full flex items-center justify-center relative">
                  <step.icon className="w-10 h-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-900">
                    {step.number}
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-6 text-4xl text-gray-300 dark:text-gray-600">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
