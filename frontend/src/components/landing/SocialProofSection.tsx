import { motion } from 'motion/react';
import { Star, Shield } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Freelancer',
    text: 'Antes eu perdia horas com planilhas. Agora registro tudo em segundos pelo WhatsApp e foco no que importa: meu trabalho!',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    name: 'João Santos',
    role: 'Empresário',
    text: 'Os alertas automáticos me salvaram! Descobri que estava gastando 40% a mais do que planejava. Agora tenho controle total.',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    name: 'Ana Costa',
    role: 'Professora',
    text: 'O Synca mudou a forma como vejo minhas finanças. A categorização inteligente é incrível! Economizei R$ 800 no primeiro mês.',
    rating: 5,
    avatar: '👩‍🏫',
  },
];

const stats = [
  { value: '+1.000', label: 'Usuários Ativos' },
  { value: '⭐ 5.0', label: 'Satisfação' },
  { value: 'R$ 500k+', label: 'Economizados' },
  { value: '4h/mês', label: 'Tempo Economizado' },
];

export function SocialProofSection() {
  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-900">
      <div className="container mx-auto">
        {/* Stats Bar */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold text-[#1E3A8A] dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Descubra como o Synca está transformando a vida financeira de milhares de pessoas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-2xl mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.text}"</p>
            </motion.div>
          ))}
        </div>

        {/* Security Badge */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center bg-blue-50 dark:bg-slate-800 rounded-2xl p-8"
        >
          <Shield className="w-12 h-12 text-[#1E3A8A] dark:text-blue-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sua segurança é nossa prioridade
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Criptografia de ponta a ponta • Dados protegidos • Cancelamento fácil a qualquer momento
          </p>
        </motion.div>
      </div>
    </section>
  );
}
