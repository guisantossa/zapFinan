import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

const colors = ['#1E3A8A', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function PieChartCard() {
  const { data: dashboardData } = useEnhancedDashboard();

  // Prepare chart data from real dashboard data
  const totalExpenses = dashboardData?.resumo?.total_despesas || 0;
  const chartData = dashboardData?.gastos_por_categoria?.map((categoria: any, index: number) => ({
    name: categoria.categoria,
    value: totalExpenses > 0 ? Math.round((categoria.valor / totalExpenses) * 100) : 0,
    amount: categoria.valor,
    color: colors[index % colors.length]
  })) || [];

  if (!dashboardData) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="animate-pulse">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value}% (R$ ${props.payload.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
                'Participação'
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}