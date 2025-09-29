import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-8 px-4"
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-sm">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <img 
            src="https://horizons-cdn.hostinger.com/574546d7-725b-46f0-80e2-c5b20585717e/75d53d209109e0b08110512c97438fbb.png" 
            alt="Synca Logo Icon" 
            className="w-8 h-8 filter invert"
          />
          <span className="font-bold text-white">Synca</span>
        </div>
        <p className="text-center md:text-right">
          <span>© 2025 Synca – Todos os direitos reservados.</span>
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;