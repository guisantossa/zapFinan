import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Marketing', value: 35, color: '#1E3A8A' },
  { name: 'Operacional', value: 25, color: '#22C55E' },
  { name: 'Pessoal', value: 20, color: '#EF4444' },
  { name: 'Tecnologia', value: 12, color: '#F59E0B' },
  { name: 'Outros', value: 8, color: '#8B5CF6' },
];

export function PieChartCard() {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}