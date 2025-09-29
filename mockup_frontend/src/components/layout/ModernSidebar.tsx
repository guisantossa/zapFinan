import { Home, Users, DollarSign, BarChart, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../ui/utils';

interface ModernSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'charges', label: 'Cobranças', icon: DollarSign },
  { id: 'reports', label: 'Relatórios', icon: BarChart },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function ModernSidebar({ activeTab, onTabChange }: ModernSidebarProps) {
  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-0 top-0 h-full w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50"
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
      <nav className="p-6 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                ease: "easeOut" 
              }}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full group relative flex items-center space-x-4 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left",
                isActive
                  ? "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
              )}
              whileHover={{ 
                scale: 1.02,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{item.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute right-3 w-2 h-2 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-8 left-6 right-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-xs font-bold text-white">ZF</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pro Plan</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unlimited access</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}