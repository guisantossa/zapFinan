import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

const colors = ['#1E3A8A', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const mockCategories = [
  { name: 'Marketing', amount: 'R$ 15.230', percentage: 35, color: '#1E3A8A' },
  { name: 'Operacional', amount: 'R$ 10.890', percentage: 25, color: '#22C55E' },
  { name: 'Pessoal', amount: 'R$ 8.720', percentage: 20, color: '#EF4444' },
  { name: 'Tecnologia', amount: 'R$ 5.240', percentage: 12, color: '#F59E0B' },
  { name: 'Outros', amount: 'R$ 3.490', percentage: 8, color: '#8B5CF6' },
];

export function CategoryRanking() {
  const { data: dashboardData } = useEnhancedDashboard();

  // Calculate categories from real data
  const totalExpenses = dashboardData?.resumo?.total_despesas || 0;
  const categories = dashboardData?.gastos_por_categoria?.map((categoria: any, index: number) => ({
    name: categoria.categoria,
    amount: `R$ ${categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    percentage: totalExpenses > 0 ? Math.round((categoria.valor / totalExpenses) * 100) : 0,
    color: colors[index % colors.length]
  })).sort((a: any, b: any) => b.percentage - a.percentage) || mockCategories;
  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle>Ranking de Categorias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, index) => (
          <div key={category.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{category.amount}</span>
            </div>
            <Progress 
              value={category.percentage} 
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}