import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

export function BarChartCard() {
  const { data: dashboardData } = useEnhancedDashboard();

  // Prepare chart data from real dashboard data
  const chartData = dashboardData?.evolucao_diaria?.slice(-7).map((day: any, index: number) => ({
    date: new Date(day.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    receita: day.receitas || 0,
    despesa: day.despesas || 0
  })) || [];

  if (!dashboardData) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Receitas vs Despesas - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="animate-pulse">
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle>Receitas vs Despesas - Últimos 7 Dias</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => [`R$ ${value.toLocaleString()}`, '']}
              labelStyle={{ color: '#666' }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="receita" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}