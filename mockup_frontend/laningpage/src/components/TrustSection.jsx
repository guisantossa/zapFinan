import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ana P.',
    text: 'O Synca mudou a forma como vejo minhas finanças. É tão fácil que nem parece que estou controlando dinheiro!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxhbmElMjBwcm9maWxlfGVufDB8fHx8MTcwMTY1NDY3Nnww&ixlib=rb-4.0.3&q=80&w=1080'
  },
  {
    name: 'Ricardo G.',
    text: 'Nunca fui bom com orçamentos, mas com os alertas do Synca, consigo me manter no controle sem esforço.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxiaXJkJTIwcHJvZmlsZXxlbnwwfHx8fDE3MDE2NTQ2NzZ8MA&ixlib=rb-4.0.3&q=80&w=1080'
  },
  {
    name: 'Mariana S.',
    text: 'A categorização automática é um salva-vidas! Finalmente entendo para onde meu dinheiro está indo.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxtYXJpYW5hJTIwcHJvZmlsZXxlbnwwfHx8fDE3MDE2NTQ2NzZ8MA&ixlib=rb-4.0.3&q=80&w=1080'
  }
];

const TrustSection = () => {
  return (
    <section id="depoimentos" className="py-20 px-4 bg-blue-50 dark:bg-slate-800">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            O que nossos usuários dizem
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Veja como o Synca está transformando a vida financeira de milhares de pessoas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar}
                  alt={`Avatar de ${testimonial.name}`}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic">"{testimonial.text}"</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center text-slate-700 dark:text-slate-300"
        >
          <p className="text-lg font-semibold mb-2">Sua segurança é nossa prioridade.</p>
          <p className="text-md">Garantia de segurança de dados e cancelamento fácil a qualquer momento.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;