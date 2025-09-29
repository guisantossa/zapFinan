import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import BudgetSection from '@/components/BudgetSection';
import PricingSection from '@/components/PricingSection';
import TrustSection from '@/components/TrustSection';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <div className="min-h-screen bg-[#f7f7f9] text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <Helmet>
        <title>Synca - Seu Tempo e Seu Dinheiro, Finalmente CONECTADOS.</title>
        <meta name="description" content="Gerencie suas finanças e sua agenda automaticamente, diretamente pelo WhatsApp que você já usa. Comece seu teste gratuito de 7 dias!" />
      </Helmet>
      
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <BudgetSection />
        <PricingSection />
        <TrustSection />
        <CallToAction />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;