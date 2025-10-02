import { Home, CreditCard, PiggyBank, Calendar, BarChart, LogOut, DollarSign, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPlan } from '../../hooks/useUserPlan';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { toast } from 'sonner';

type MenuItem = {
  id: string;
  label: string;
  icon: typeof Home;
  feature?: 'transactions' | 'budgets' | 'commitments' | 'reports';
};

const menuItems: MenuItem[] = [
  { id: '/dashboard', label: 'Dashboard', icon: Home },
  { id: '/dashboard/transacoes', label: 'Transações', icon: CreditCard, feature: 'transactions' },
  { id: '/dashboard/orcamentos', label: 'Orçamentos', icon: PiggyBank, feature: 'budgets' },
  { id: '/dashboard/compromissos', label: 'Compromissos', icon: Calendar, feature: 'commitments' },
  { id: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart, feature: 'reports' },
];

interface ModernSidebarProps {
  onClose?: () => void;
}

export function ModernSidebar({ onClose }: ModernSidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { features, hasFeature } = useUserPlan();

  const handleMenuClick = (item: MenuItem, e: React.MouseEvent) => {
    if (item.feature && !hasFeature(item.feature)) {
      e.preventDefault();
      toast.error('Upgrade Necessário', {
        description: `${item.label} requer upgrade do plano`,
        action: {
          label: 'Ver Planos',
          onClick: () => navigate('/planos'),
        },
        duration: 5000,
      });
    } else if (onClose) {
      // Fechar sidebar mobile após clicar
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-y-auto"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        borderColor: 'var(--glass-border)'
      }}
    >
      {/* Logo */}
      <div className="p-8 border-b border-gray-200/30 dark:border-gray-700/30">
        <motion.div 
          className="flex items-center space-x-4"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#22C55E] rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent">
              ZapFinan
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Financial SaaS</p>
          </div>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.id;
          const isLocked = item.feature && !hasFeature(item.feature);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <Link
                to={item.id}
                onClick={(e) => handleMenuClick(item, e)}
                className={cn(
                  "w-full group relative flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left",
                  isActive && !isLocked
                    ? "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white shadow-lg shadow-blue-500/25"
                    : isLocked
                    ? "text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive && !isLocked
                    ? "text-white"
                    : isLocked
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                )} />
                <span className="font-medium flex-1">{item.label}</span>

                {/* Lock icon for locked items */}
                {isLocked && (
                  <Lock className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                )}

                {/* Active indicator */}
                {isActive && !isLocked && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-3 w-2 h-2 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-6 space-y-4">
        {/* User Info */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.nome || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.plano?.nome || 'Sem Plano'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={logout}
          variant="outline"
          className="w-full justify-start text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </motion.div>
  );
}