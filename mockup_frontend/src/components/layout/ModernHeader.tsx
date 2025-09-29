import { Search, Bell, Plus, User, LogOut, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useState } from 'react';

interface ModernHeaderProps {
  onNewCharge: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function ModernHeader({ onNewCharge, darkMode, onToggleDarkMode }: ModernHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 right-0 left-72 h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-50"
      style={{ 
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        borderColor: 'var(--glass-border)'
      }}
    >
      <div className="flex items-center justify-between px-8 h-full">
        {/* Welcome Section */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bem-vindo de volta! 👋
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className={`relative transition-all duration-300 ${
              searchFocused ? 'transform scale-105' : ''
            }`}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar transações, clientes..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-12 w-80 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-2xl backdrop-blur-sm focus:bg-white dark:focus:bg-gray-800 focus:shadow-lg transition-all duration-300"
              />
            </div>
          </motion.div>

          {/* New Charge Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Button 
              onClick={onNewCharge}
              className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white rounded-2xl px-6 py-2.5 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 group"
              whileHover={{ 
                scale: 1.05,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Nova Cobrança
            </Button>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              className="rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              whileHover={{ 
                scale: 1.1,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </Button>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              whileHover={{ 
                scale: 1.1,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-5 h-5" />
              <motion.span 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>

          {/* User Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="p-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                >
                  <Avatar className="w-9 h-9 border-2 border-white dark:border-gray-700 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white font-semibold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl"
              >
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">João Desenvolvedor</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">joao@zapfinan.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl">
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}