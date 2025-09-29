import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare as MessageSquareText, CalendarCheck, Brain } from 'lucide-react';

const features = [
  {
    icon: MessageSquareText,
    title: 'Registro Imediato via Chat',
    description: 'Anote suas despesas e receitas em segundos, diretamente no WhatsApp. Sem abrir apps, sem complicação.'
  },
  {
    icon: CalendarCheck,
    title: 'Compromissos Sincronizados',
    description: 'Gerencie seu tempo e dinheiro juntos. Receba lembretes e organize suas finanças de acordo com sua agenda.'
  },
  {
    icon: Brain,
    title: 'Categorização Inteligente',
    description: 'Nossa IA classifica automaticamente suas transações, dando a você uma visão clara de onde seu dinheiro está indo.'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 bg-[#f7f7f9] dark:bg-slate-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Pare de se perder. Comece a Sincronizar.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            O poder do WhatsApp para suas finanças, com inteligência e simplicidade.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700"
            >
              <div className="mb-6 flex justify-center">
                <feature.icon className="w-12 h-12 text-[#42a5f5] dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-center">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;