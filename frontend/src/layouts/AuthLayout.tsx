import { Outlet } from "react-router-dom";
import { motion } from "motion/react";
import { DollarSign } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-40 right-32 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/20 rounded-full blur-lg" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-white p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Synca</h1>
              <p className="text-blue-100 text-lg">Controle financeiro inteligente via WhatsApp</p>
            </div>

            {/* Features */}
            <div className="space-y-6 max-w-md">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center space-x-4"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Integração completa com WhatsApp</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center space-x-4"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Relatórios automáticos e insights</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center space-x-4"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-blue-100">Gestão de orçamentos e metas</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
