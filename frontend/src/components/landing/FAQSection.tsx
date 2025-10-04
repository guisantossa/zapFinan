import { motion } from 'motion/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Como funciona o período de teste gratuito?', a: '7 dias grátis, sem cartão de crédito. Cancele quando quiser.' },
  { q: 'Meus dados estão seguros?', a: 'Sim! Usamos criptografia de ponta a ponta. Seus dados financeiros são 100% privados.' },
  { q: 'Preciso instalar algum app?', a: 'Não! Funciona 100% pelo WhatsApp que você já usa. Simples assim.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Claro! Sem multas, sem burocracia. Cancele com 1 clique.' },
  { q: 'Quantas transações posso registrar?', a: 'No plano Grátis são 50/mês. No Pro e Enterprise são ilimitadas.' },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-900">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{y:50,opacity:0}} whileInView={{y:0,opacity:1}} transition={{duration:0.8}} viewport={{once:true}} className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Perguntas Frequentes</h2>
        </motion.div>
        <div className="space-y-4">
          {faqs.map((faq,idx)=>(
            <motion.div key={idx} initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} transition={{duration:0.5,delay:idx*0.1}} viewport={{once:true}} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button onClick={()=>setOpen(open===idx?null:idx)} className="w-full px-6 py-4 text-left flex justify-between items-center bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${open===idx?'rotate-180':''}`}/>
              </button>
              {open===idx&&<div className="px-6 py-4 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300">{faq.a}</div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
