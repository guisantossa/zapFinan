import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useState, useEffect } from 'react';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

const colors = ['#1E3A8A', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const RADIAN = Math.PI / 180;

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Valor: <span className="font-semibold">R$ {data.amount.toLocaleString()}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Percentual: <span className="font-semibold">{data.value}%</span>
        </p>
      </motion.div>
    );
  }
  return null;
};

const AnimatedPieSlice = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  
  return (
    <motion.g>
      <motion.path
        d={`M ${cx},${cy} L ${cx + innerRadius * Math.cos(-startAngle * RADIAN)},${cy + innerRadius * Math.sin(-startAngle * RADIAN)} A ${innerRadius},${innerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0},0 ${cx + innerRadius * Math.cos(-endAngle * RADIAN)},${cy + innerRadius * Math.sin(-endAngle * RADIAN)} L ${cx + outerRadius * Math.cos(-endAngle * RADIAN)},${cy + outerRadius * Math.sin(-endAngle * RADIAN)} A ${outerRadius},${outerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0},1 ${cx + outerRadius * Math.cos(-startAngle * RADIAN)},${cy + outerRadius * Math.sin(-startAngle * RADIAN)} Z`}
        fill={fill}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          delay: props.index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ 
          scale: 1.05,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
      />
    </motion.g>
  );
};

export function AnimatedPieChart() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: dashboardData } = useEnhancedDashboard();

  // Prepare chart data from real dashboard data
  const totalExpenses = dashboardData?.resumo?.total_despesas || 0;
  const data = dashboardData?.gastos_por_categoria?.map((categoria: any, index: number) => ({
    name: categoria.categoria,
    value: totalExpenses > 0 ? Math.round((categoria.valor / totalExpenses) * 100) : 0,
    amount: categoria.valor,
    color: colors[index % colors.length]
  })) || [];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      whileHover={{ 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="group"
    >
      <Card className="
        relative overflow-hidden rounded-3xl border-0 bg-white/60 dark:bg-slate-800/60 
        backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500
        group-hover:shadow-purple-500/10
      "
      style={{
        background: 'var(--card-blur)',
        backdropFilter: 'var(--backdrop-blur)'
      }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        <CardHeader className="relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CardTitle className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
              <span>Despesas por Categoria</span>
            </CardTitle>
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Chart */}
            <div className="relative">
              {isVisible && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {/* Center info */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalExpenses > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)
                    : 'R$ 0,00'
                  }
                </p>
              </motion.div>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {data.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3,
                    delay: 0.6 + (index * 0.1)
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 group/item"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      R$ {item.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.value}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-100/20 to-transparent rounded-full -translate-y-16 -translate-x-16 group-hover:scale-110 transition-transform duration-700" />
      </Card>
    </motion.div>
  );
}