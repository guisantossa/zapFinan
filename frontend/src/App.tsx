import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';

// Layout Components
import { ModernSidebar } from './components/layout/ModernSidebar';
import { ModernHeader } from './components/layout/ModernHeader';

// Dashboard Components
import { PremiumSummaryCard } from './components/dashboard/PremiumSummaryCard';
import { AnimatedBarChart } from './components/dashboard/AnimatedBarChart';
import { AnimatedPieChart } from './components/dashboard/AnimatedPieChart';
import { ModernTransactionTable } from './components/dashboard/ModernTransactionTable';

// Client Components
import { ClientTable } from './components/clients/ClientTable';
import { ClientFormModal } from './components/clients/ClientFormModal';

// Charge Components
import { ChargeTable } from './components/charges/ChargeTable';
import { ChargeFormModal } from './components/charges/ChargeFormModal';

interface Client {
  id?: number;
  name: string;
  email: string;
  phone: string;
  document: string;
}

interface Charge {
  id?: number;
  description: string;
  client: string;
  value: string;
  dueDate: string;
  channel: 'whatsapp' | 'email';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleNewCharge = () => {
    setSelectedCharge(null);
    setIsChargeModalOpen(true);
  };

  const handleEditCharge = (charge: any) => {
    setSelectedCharge(charge);
    setIsChargeModalOpen(true);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderContent = () => {
    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.5,
          ease: "easeOut",
          staggerChildren: 0.1
        }
      },
      exit: { 
        opacity: 0, 
        y: -20,
        transition: { 
          duration: 0.3,
          ease: "easeIn"
        }
      }
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            {/* Page Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Dashboard Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Acompanhe suas métricas e performance em tempo real
              </p>
            </motion.div>

            {/* Summary Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={contentVariants}
            >
              <PremiumSummaryCard
                title="Receita do Mês"
                value="R$ 67.430"
                icon={TrendingUp}
                color="green"
                trend={{ value: "12.5%", isPositive: true }}
                delay={0}
              />
              <PremiumSummaryCard
                title="Despesa do Mês"
                value="R$ 43.570"
                icon={TrendingDown}
                color="red"
                trend={{ value: "8.2%", isPositive: false }}
                delay={0.1}
              />
              <PremiumSummaryCard
                title="Saldo Líquido"
                value="R$ 23.860"
                icon={DollarSign}
                color="blue"
                trend={{ value: "18.7%", isPositive: true }}
                delay={0.2}
              />
              <PremiumSummaryCard
                title="Transações"
                value="142"
                icon={CreditCard}
                color="purple"
                trend={{ value: "23", isPositive: true }}
                delay={0.3}
              />
            </motion.div>

            {/* Charts Row */}
            <motion.div 
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
              variants={contentVariants}
            >
              <AnimatedBarChart />
              <AnimatedPieChart />
            </motion.div>

            {/* Transactions Table */}
            <motion.div variants={contentVariants}>
              <ModernTransactionTable />
            </motion.div>
          </motion.div>
        );

      case 'clients':
        return (
          <motion.div
            key="clients"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Gestão de Clientes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie seus clientes e mantenha informações atualizadas
              </p>
            </motion.div>
            
            <ClientTable 
              onNewClient={handleNewClient}
              onEditClient={handleEditClient}
            />
          </motion.div>
        );

      case 'charges':
        return (
          <motion.div
            key="charges"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Cobranças e Faturamento
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Controle suas cobranças e acompanhe recebimentos
              </p>
            </motion.div>
            
            <ChargeTable 
              onNewCharge={handleNewCharge}
              onEditCharge={handleEditCharge}
            />
          </motion.div>
        );

      case 'reports':
        return (
          <motion.div
            key="reports"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center justify-center h-96"
          >
            <div className="text-center p-12 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Relatórios Avançados
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Seção de relatórios detalhados em desenvolvimento. Em breve você terá acesso a insights profundos sobre seu negócio.
                </p>
              </motion.div>
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div
            key="settings"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center justify-center h-96"
          >
            <div className="text-center p-12 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Configurações
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Personalize sua experiência e configure preferências do sistema.
                </p>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      darkMode ? 'dark bg-slate-900' : 'bg-[#FAFBFC]'
    }`}>
      <ModernSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <ModernHeader 
        onNewCharge={handleNewCharge} 
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      
      {/* Main Content */}
      <main className="ml-72 pt-20 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/20 to-transparent dark:from-blue-900/10 rounded-full transform translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/20 to-transparent dark:from-green-900/10 rounded-full transform -translate-x-48 translate-y-48" />
      </div>

      {/* Modals */}
      <ClientFormModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
      />

      <ChargeFormModal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        charge={selectedCharge}
      />

      {/* Toast Notifications */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: darkMode ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
          }
        }}
      />
    </div>
  );
}