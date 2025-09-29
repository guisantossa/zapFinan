import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'gray';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function SummaryCard({ title, value, icon: Icon, color, trend }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-[#22C55E] text-white',
    red: 'bg-red-500 text-white',
    blue: 'bg-[#1E3A8A] text-white',
    gray: 'bg-gray-500 text-white',
  };

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}