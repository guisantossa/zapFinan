import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CallToAction = () => {
  const { toast } = useToast();

  const handleCTAClick = () => {
    toast({
      title: "Botão 'Comece AGORA!' clicado!",
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la em seu próximo prompt! 🚀",
    });
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-[#1a237e] to-[#42a5f5] text-white">
      <div className="container mx-auto text-center">
        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl lg:text-5xl font-extrabold mb-8 leading-tight"
        >
          🚀 Não Perca Mais Tempo e Dinheiro. Comece AGORA!
        </motion.h2>
        <motion.p
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl mb-10 max-w-3xl mx-auto"
        >
          Junte-se a milhares de usuários que já estão sincronizando suas vidas financeiras com o Synca.
        </motion.p>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <Button
            onClick={handleCTAClick}
            className="bg-white text-[#1a237e] px-10 py-4 rounded-full text-xl font-bold hover:bg-blue-100 transition-all duration-300 shadow-lg"
          >
            Comece Seu Teste Gratuito
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;