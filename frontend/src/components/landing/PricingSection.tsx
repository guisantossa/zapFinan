import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    description: 'Perfeito para começar',
    features: ['50 transações/mês', 'Categorização automática', 'Relatórios básicos', 'Suporte por email'],
    cta: 'Começar Grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 19,90',
    period: '/mês',
    description: 'Mais popular',
    features: ['Transações ilimitadas', 'Orçamentos ilimitados', 'Relatórios avançados', 'Alertas automáticos', 'Suporte prioritário', 'Exportação de dados'],
    cta: 'Teste Grátis 7 Dias',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 49,90',
    period: '/mês',
    description: 'Para equipes',
    features: ['Tudo do Pro', 'Múltiplos usuários', 'Dashboard empresarial', 'API personalizada', 'Suporte 24/7'],
    cta: 'Falar com Vendas',
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <motion.div initial={{y:50,opacity:0}} whileInView={{y:0,opacity:1}} transition={{duration:0.8}} viewport={{once:true}} className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">Planos Simples e Transparentes</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Comece grátis. Upgrade quando precisar.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan,idx)=>(
            <motion.div key={idx} initial={{y:50,opacity:0}} whileInView={{y:0,opacity:1}} transition={{duration:0.6,delay:idx*0.1}} viewport={{once:true}} className={`rounded-2xl p-8 ${plan.highlighted?'bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white shadow-2xl scale-105':'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700'}`}>
              {plan.highlighted&&<div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full inline-block font-bold text-sm mb-4">🔥 MAIS POPULAR</div>}
              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted?'text-white':'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
              <p className={`mb-6 ${plan.highlighted?'text-blue-100':'text-gray-600 dark:text-gray-400'}`}>{plan.description}</p>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${plan.highlighted?'text-white':'text-[#1E3A8A] dark:text-blue-400'}`}>{plan.price}</span>
                <span className={plan.highlighted?'text-blue-100':'text-gray-600 dark:text-gray-400'}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f,i)=>(
                  <li key={i} className="flex items-start">
                    <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${plan.highlighted?'text-yellow-300':'text-green-500'}`}/>
                    <span className={plan.highlighted?'text-blue-50':'text-gray-600 dark:text-gray-300'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/register">
                <Button className={`w-full ${plan.highlighted?'bg-white text-[#1E3A8A] hover:bg-blue-100':'bg-[#1E3A8A] text-white hover:bg-[#1E40AF]'}`}>{plan.cta}</Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
