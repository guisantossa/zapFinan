import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState, useEffect } from 'react';

const data = [
  { month: 'Jul', receita: 45000, despesa: 32000 },
  { month: 'Ago', receita: 52000, despesa: 28000 },
  { month: 'Set', receita: 48000, despesa: 35000 },
  { month: 'Out', receita: 61000, despesa: 42000 },
  { month: 'Nov', receita: 55000, despesa: 38000 },
  { month: 'Dez', receita: 67000, despesa: 45000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-3 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {entry.dataKey}:
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              R$ {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

const AnimatedBar = (props: any) => {
  const { payload, x, y, width, height, fill } = props;
  
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={6}
      ry={6}
      initial={{ height: 0, y: y + height }}
      animate={{ height, y }}
      transition={{ 
        duration: 0.8,
        delay: payload.index * 0.1,
        ease: "easeOut"
      }}
    />
  );
};

export function AnimatedBarChart() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="group"
    >
      <Card className="
        relative overflow-hidden rounded-3xl border-0 bg-white/60 dark:bg-slate-800/60 
        backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500
        group-hover:shadow-blue-500/10
      "
      style={{
        background: 'var(--card-blur)',
        backdropFilter: 'var(--backdrop-blur)'
      }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        <CardHeader className="relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <span>Receitas vs Despesas - Últimos 6 Meses</span>
            </CardTitle>
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative">
          {isVisible && (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="despesaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(148, 163, 184, 0.2)" 
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  dy={10}
                />
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Bar 
                  dataKey="receita" 
                  fill="url(#receitaGradient)"
                  radius={[6, 6, 0, 0]}
                  shape={(props: any) => <AnimatedBar {...props} />}
                />
                
                <Bar 
                  dataKey="despesa" 
                  fill="url(#despesaGradient)"
                  radius={[6, 6, 0, 0]}
                  shape={(props: any) => <AnimatedBar {...props} />}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -translate-y-20 translate-x-20 group-hover:scale-110 transition-transform duration-700" />
      </Card>
    </motion.div>
  );
}