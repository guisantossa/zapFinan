import React from 'react';
import type { LucideProps } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';

interface PremiumSummaryCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<LucideProps>;
  color: 'green' | 'red' | 'blue' | 'purple';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
}

const colorConfigs = {
  green: {
    gradient: 'from-green-500 to-emerald-600',
    lightBg: 'from-green-50 to-emerald-50',
    darkBg: 'from-green-900/20 to-emerald-900/20',
    shadow: 'shadow-green-500/20',
    glowShadow: 'shadow-green-500/40',
    border: 'border-green-200/50 dark:border-green-800/50'
  },
  red: {
    gradient: 'from-red-500 to-rose-600',
    lightBg: 'from-red-50 to-rose-50',
    darkBg: 'from-red-900/20 to-rose-900/20',
    shadow: 'shadow-red-500/20',
    glowShadow: 'shadow-red-500/40',
    border: 'border-red-200/50 dark:border-red-800/50'
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'from-blue-50 to-indigo-50',
    darkBg: 'from-blue-900/20 to-indigo-900/20',
    shadow: 'shadow-blue-500/20',
    glowShadow: 'shadow-blue-500/40',
    border: 'border-blue-200/50 dark:border-blue-800/50'
  },
  purple: {
    gradient: 'from-purple-500 to-violet-600',
    lightBg: 'from-purple-50 to-violet-50',
    darkBg: 'from-purple-900/20 to-violet-900/20',
    shadow: 'shadow-purple-500/20',
    glowShadow: 'shadow-purple-500/40',
    border: 'border-purple-200/50 dark:border-purple-800/50'
  }
};

export function PremiumSummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  delay = 0 
}: PremiumSummaryCardProps) {
  const config = colorConfigs[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      whileHover={{ 
        y: -4, 
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      }}
      className="group"
    >
      <Card className={`
        relative overflow-hidden rounded-3xl border-0 bg-white/60 dark:bg-slate-800/60 
        backdrop-blur-xl ${config.shadow} hover:${config.glowShadow} 
        transition-all duration-500 group-hover:shadow-2xl
      `}
      style={{
        background: 'var(--card-blur)',
        backdropFilter: 'var(--backdrop-blur)'
      }}
      >
        {/* Gradient Background */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${config.lightBg} dark:${config.darkBg}
          opacity-50 group-hover:opacity-70 transition-opacity duration-300
        `} />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        <CardContent className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {title}
              </motion.p>
              
              <motion.p 
                className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: delay + 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
              >
                {value}
              </motion.p>
              
              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.4 }}
                  className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                    ${trend.isPositive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }
                  `}
                >
                  <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
                  {trend.value}
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                delay: delay + 0.5,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              whileHover={{ 
                scale: 1.1, 
                rotate: 5,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              className={`
                relative w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} 
                flex items-center justify-center shadow-lg group-hover:shadow-xl
                transition-all duration-300
              `}
            >
              <Icon className="w-7 h-7 text-white" />
              
              {/* Glow effect */}
              <div className={`
                absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} 
                opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300
              `} />
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-10 -translate-x-10 group-hover:scale-110 transition-transform duration-500" />
        </CardContent>
      </Card>
    </motion.div>
  );
}