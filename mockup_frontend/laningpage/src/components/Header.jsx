import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sun, Moon, Menu, X } from 'lucide-react';

const Header = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Check for user preference in localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    toast({
      title: `Tema ${isDarkMode ? 'claro' : 'escuro'} ativado!`,
      description: "Aproveite a nova visualização.",
    });
  };

  const handleNavigationClick = (featureName) => {
    toast({
      title: `Navegação para ${featureName}`,
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la em seu próximo prompt! 🚀",
    });
    setIsMenuOpen(false); // Close menu on item click
  };

  const handleAuthClick = (action) => {
    toast({
      title: `${action} clicado!`,
      description: "🚧 Esta funcionalidade não está implementada ainda—mas não se preocupe! Você pode solicitá-la em seu próximo prompt! 🚀",
    });
    setIsMenuOpen(false); // Close menu on item click
  };

  const navItems = [
    { name: 'Recursos', href: '#features' },
    { name: 'Orçamentos', href: '#budget' },
    { name: 'Planos', href: '#planos' },
    { name: 'Depoimentos', href: '#depoimentos' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-700/80"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="https://horizons-cdn.hostinger.com/574546d7-725b-46f0-80e2-c5b20585717e/75d53d209109e0b08110512c97438fbb.png" 
            alt="Synca Logo Icon" 
            className="w-10 h-10"
          />
          <span className="text-2xl font-bold text-slate-800 dark:text-white">
            Synca
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => handleNavigationClick(item.name)}
              className="text-slate-600 dark:text-slate-300 hover:text-[#42a5f5] dark:hover:text-[#42a5f5] transition-colors font-medium"
            >
              {item.name}
            </a>
          ))}
          <Button
            variant="ghost"
            onClick={() => handleAuthClick('Login')}
            className="text-slate-600 dark:text-slate-300 hover:text-[#42a5f5] dark:hover:text-[#42a5f5]"
          >
            Login
          </Button>
          <Button
            onClick={() => handleAuthClick('Registrar')}
            className="bg-gradient-to-r from-[#1a237e] to-[#42a5f5] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300"
          >
            Registrar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-slate-600 dark:text-slate-300 hover:text-[#42a5f5] dark:hover:text-[#42a5f5]"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-slate-600 dark:text-slate-300 hover:text-[#42a5f5] dark:hover:text-[#42a5f5]"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-slate-600 dark:text-slate-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-4 px-4"
        >
          <ul className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  onClick={() => handleNavigationClick(item.name)}
                  className="block text-slate-700 dark:text-slate-200 hover:text-[#42a5f5] dark:hover:text-[#42a5f5] font-medium text-lg"
                >
                  {item.name}
                </a>
              </li>
            ))}
            <li>
              <Button
                variant="ghost"
                onClick={() => handleAuthClick('Login')}
                className="w-full justify-start text-slate-700 dark:text-slate-200 hover:text-[#42a5f5] dark:hover:text-[#42a5f5] text-lg"
              >
                Login
              </Button>
            </li>
            <li>
              <Button
                onClick={() => handleAuthClick('Registrar')}
                className="w-full bg-gradient-to-r from-[#1a237e] to-[#42a5f5] text-white py-2 rounded-full text-lg"
              >
                Registrar
              </Button>
            </li>
          </ul>
        </motion.nav>
      )}
    </motion.header>
  );
};

export default Header;