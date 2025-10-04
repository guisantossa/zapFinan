import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Zap, Bell, TrendingUp } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
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
                Registre gastos em 5 segundos (sem abrir app)
              </motion.li>
              <motion.li
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-center text-lg"
              >
                <Bell className="w-6 h-6 text-blue-200 mr-3 flex-shrink-0" />
                Alertas automáticos quando passar do orçamento
              </motion.li>
              <motion.li
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center text-lg"
              >
                <TrendingUp className="w-6 h-6 text-blue-200 mr-3 flex-shrink-0" />
                Relatórios automáticos no final do mês
              </motion.li>
            </ul>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-[#1E3A8A] px-8 py-6 rounded-full text-lg font-bold hover:bg-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🚀 Comece Seu Teste Grátis de 7 Dias!
                </Button>
              </Link>
            </motion.div>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-4 text-sm text-blue-100"
            >
              ✅ Mais de 1.000 usuários já economizando tempo e dinheiro • ⭐ 5.0 de satisfação
            </motion.p>
          </motion.div>

          {/* Right Column - Video Demo */}
          <motion.div
            initial={{ x: 100, opacity: 0, rotate: 5 }}
            animate={{ x: 0, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:w-1/2 flex justify-center lg:justify-end mt-12 lg:mt-0"
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Vídeo Demo - Adicionar vídeo em /public/demo-synca.mp4 */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                  poster="/banner.png"
                >
                  <source src="/demo-synca.mp4" type="video/mp4" />
                  {/* Fallback para imagem se vídeo não existir */}
                  <img src="/banner.png" alt="Demo Synca" className="w-full" />
                </video>
                {/* Badge "Ao Vivo" */}
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Sistema em Ação
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
