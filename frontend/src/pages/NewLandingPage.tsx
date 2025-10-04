import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HeroSection } from '../components/landing/HeroSection';
import { SocialProofSection } from '../components/landing/SocialProofSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { Footer } from '../components/landing/Footer';

export function NewLandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10 bg-white dark:bg-slate-900">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent mb-4">
            Bem-vindo de volta!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Você já está logado. Acesse seu dashboard para continuar gerenciando suas finanças.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]">
              Ir para Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10 bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center space-x-3">
              <img src="/logo.png" alt="Synca Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
                Synca
              </h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center space-x-4">
              <Button variant="ghost" onClick={toggleTheme}>
                {theme === 'dark' ? '🌞' : '🌙'}
              </Button>
              <Link to="/auth/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]">
                  Começar Grátis
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <SocialProofSection />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />

        {/* Final CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white">
          <div className="container mx-auto text-center">
            <motion.div initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} transition={{duration:0.8}} viewport={{once:true}}>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Pronto para Sincronizar Sua Vida?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
                Junte-se a mais de 1.000 usuários que já economizam tempo e dinheiro com o Synca
              </p>
              <Link to="/auth/register">
                <Button size="lg" className="bg-white text-[#1E3A8A] px-10 py-6 rounded-full text-lg font-bold hover:bg-blue-100">
                  🚀 Começar Teste Grátis de 7 Dias
                </Button>
              </Link>
              <p className="mt-4 text-sm text-blue-100">✅ Sem cartão de crédito • ✅ Cancele quando quiser</p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
