import React from 'react';
import { motion } from 'framer-motion';
import { BellRing, Monitor, FileText } from 'lucide-react';

const BudgetSection = () => {
  return (
    <section id="budget" className="py-20 px-4 bg-white dark:bg-slate-900">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Saiba onde você está, antes de estourar.
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Orçamentos inteligentes que te avisam antes que seja tarde demais.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column - Visual */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:w-1/2 flex justify-center"
          >
            <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Orçamento Mensal</h3>
              <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-4 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '80%' }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-[#1a237e] to-[#42a5f5] h-4 rounded-full"
                ></motion.div>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>R$ 800 de R$ 1000</span>
                <span>80% Gasto</span>
              </div>
              <p className="mt-4 text-sm text-red-500 dark:text-red-400 font-medium">
                Atenção: Você está perto de estourar seu orçamento de lazer!
              </p>
            </div>
          </motion.div>

          {/* Right Column - Key Points */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:w-1/2 space-y-8 text-center lg:text-left"
          >
            <div className="flex flex-col items-center lg:items-start">
              <BellRing className="w-10 h-10 text-[#42a5f5] dark:text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Alertas de Risco via WhatsApp</h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-md lg:max-w-none">
                Receba notificações instantâneas no seu WhatsApp quando estiver se aproximando do limite do seu orçamento.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <Monitor className="w-10 h-10 text-[#42a5f5] dark:text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Visão Web Robusta</h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-md lg:max-w-none">
                Acesse um painel completo no seu navegador para visualizar seus orçamentos, gastos e projeções detalhadas.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <FileText className="w-10 h-10 text-[#42a5f5] dark:text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Relatórios Automáticos</h3>
              <p className="text-slate-600 dark:text-slate-300 max-w-md lg:max-w-none">
                Gere relatórios personalizados com facilidade para entender seus hábitos financeiros e tomar decisões melhores.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BudgetSection;