import { useState, useEffect } from 'react';
import { Calendar, CalendarCheck, Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { reportsApi, Category } from '../../services/reportsApi';

export interface FilterState {
  data_inicio?: string;
  data_fim?: string;
  tipo?: 'despesa' | 'receita';
  categoria_id?: number;
  valor_min?: number;
  valor_max?: number;
  status?: string;
  periodicidade?: string;
}

interface ReportFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  type: 'transaction' | 'budget' | 'category' | 'summary';
  className?: string;
}

export function ReportFilters({ filters, onFiltersChange, type, className = '' }: ReportFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await reportsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' || value === 'all' ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  const getQuickDateRanges = () => [
    {
      label: 'Últimos 7 dias',
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    {
      label: 'Últimos 30 dias',
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    {
      label: 'Este mês',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    {
      label: 'Mês passado',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
    },
  ];

  const applyQuickDateRange = (start: string, end: string) => {
    onFiltersChange({
      ...filters,
      data_inicio: start,
      data_fim: end,
    });
  };

  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="p-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Filtros</h3>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700"
            >
              {isExpanded ? 'Menos filtros' : 'Mais filtros'}
            </Button>
          </div>
        </div>

        {/* Quick Date Ranges */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {getQuickDateRanges().map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyQuickDateRange(range.start, range.end)}
                className="text-xs"
              >
                <CalendarCheck className="w-3 h-3 mr-1" />
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => updateFilter('data_inicio', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => updateFilter('data_fim', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Transaction Type */}
          {(type === 'transaction' || type === 'category' || type === 'summary') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select
                value={filters.tipo || 'all'}
                onValueChange={(value) => updateFilter('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          {(type === 'transaction' || type === 'budget') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select
                value={filters.categoria_id?.toString() || 'all'}
                onValueChange={(value) => updateFilter('categoria_id', value === 'all' ? undefined : parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Carregando..." : "Todas as categorias"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.nome} ({category.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Value Range for Transactions */}
            {type === 'transaction' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Valor Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.valor_min || ''}
                    onChange={(e) => updateFilter('valor_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Valor Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.valor_max || ''}
                    onChange={(e) => updateFilter('valor_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </>
            )}

            {/* Budget Specific Filters */}
            {type === 'budget' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => updateFilter('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="dentro_limite">Dentro do Limite</SelectItem>
                      <SelectItem value="proximo_limite">Próximo do Limite</SelectItem>
                      <SelectItem value="excedeu_limite">Excedeu Limite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Periodicidade</label>
                  <Select
                    value={filters.periodicidade || 'all'}
                    onValueChange={(value) => updateFilter('periodicidade', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}