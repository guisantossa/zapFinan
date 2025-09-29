import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Zap, Bell, LayoutDashboard } from 'lucide-react';

const HeroSection = () => {
  const { toast } = useToast();

  const handleCTAClick = (action) => {
    toast({
      title: `${action} clicado!`,
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la em seu próximo prompt! 🚀",
    });
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-[#1a237e] to-[#42a5f5] text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Seu Tempo e Seu Dinheiro, Finalmente{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                CONECTADOS.
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-xl lg:max-w-none mx-auto">
              Gerencie suas finanças e sua agenda automaticamente, diretamente pelo WhatsApp que você já usa.
            </p>

            <ul className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
              <motion.li
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center text-lg"
              >
                <Zap className="w-6 h-6 text-blue-200 mr-3 flex-shrink-0" />
                Anote tudo em 5 segundos (sem abrir app).
              </motion.li>
              <motion.li
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-center text-lg"
              >
                <Bell className="w-6 h-6 text-blue-200 mr-3 flex-shrink-0" />
                Receba alertas de orçamento em tempo real.
              </motion.li>
              <motion.li
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center text-lg"
              >
                <LayoutDashboard className="w-6 h-6 text-blue-200 mr-3 flex-shrink-0" />
                Tenha um painel Web robusto para insights profundos.
              </motion.li>
            </ul>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                onClick={() => handleCTAClick('Começar Teste Gratuito')}
                className="bg-white text-[#1a237e] px-8 py-3 rounded-full text-lg font-bold hover:bg-blue-100 transition-all duration-300 shadow-lg"
              >
                🚀 Comece Seu Teste Gratuito de 7 Dias!
              </Button>
            </motion.div>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-4 text-sm text-blue-100"
            >
              Mais de 1.000 usuários sincronizando suas vidas financeiras.
            </motion.p>
          </motion.div>

          {/* Right Column - Visual Mockup */}
          <motion.div
            initial={{ x: 100, opacity: 0, rotate: 5 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:w-1/2 flex justify-center lg:justify-end mt-12 lg:mt-0"
          >
            <div className="relative w-64 h-auto md:w-80 lg:w-96">
              <img
                alt="Smartphone mockup showing WhatsApp chat with financial message"
                className="w-full h-full object-contain"
               src="https://images.unsplash.com/photo-1685586784800-42bac9c32db9" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;