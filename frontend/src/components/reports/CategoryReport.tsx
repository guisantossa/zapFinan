import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpDown, Tag, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { ReportFilters, FilterState } from './ReportFilters';
import { ExportButton } from './ExportButton';
import { reportsApi, CategorySummary } from '../../services/reportsApi';
import { toast } from 'sonner';

interface CategoryReportProps {
  className?: string;
}

export function CategoryReport({ className = '' }: CategoryReportProps) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategorySummary[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('total_valor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadCategories();
  }, [filters]);

  useEffect(() => {
    applyFilters();
  }, [categories, filters]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await reportsApi.getCategoriesSummary(
        filters.data_inicio,
        filters.data_fim
      );
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar análise por categorias:', error);
      toast.error('Erro ao carregar análise por categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...categories];

    // Filter by tipo
    if (filters.tipo) {
      filtered = filtered.filter(category => category.tipo === filters.tipo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof CategorySummary];
      let bValue = b[sortField as keyof CategorySummary];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setFilteredCategories(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (value: number) => {
    return reportsApi.formatCurrency(value);
  };

  const formatPercentage = (value: number) => {
    return reportsApi.formatPercentage(value);
  };

  // Calculate summary statistics
  const totalReceitas = filteredCategories
    .filter(c => c.tipo === 'receita')
    .reduce((sum, c) => sum + reportsApi.safeNumber(c.total_valor), 0);

  const totalDespesas = filteredCategories
    .filter(c => c.tipo === 'despesa')
    .reduce((sum, c) => sum + reportsApi.safeNumber(c.total_valor), 0);

  const totalTransacoes = filteredCategories
    .reduce((sum, c) => sum + reportsApi.safeNumber(c.total_transacoes), 0);

  const totalCategorias = filteredCategories.length;

  const mediaTransacoesPorCategoria = totalCategorias > 0
    ? totalTransacoes / totalCategorias
    : 0;

  const topCategoria = filteredCategories.length > 0
    ? filteredCategories.reduce((prev, current) => {
        const prevValue = reportsApi.safeNumber(prev.total_valor);
        const currentValue = reportsApi.safeNumber(current.total_valor);
        return prevValue > currentValue ? prev : current;
      })
    : null;

  // Calculate percentages for each category
  const categoriesWithPercentage = filteredCategories.map(category => {
    const totalForType = category.tipo === 'receita' ? totalReceitas : totalDespesas;
    const categoryValue = reportsApi.safeNumber(category.total_valor);
    const categoryTransactions = reportsApi.safeNumber(category.total_transacoes);

    const percentage = totalForType > 0 ? (categoryValue / totalForType) * 100 : 0;
    const averagePerTransaction = categoryTransactions > 0
      ? categoryValue / categoryTransactions
      : 0;

    return {
      ...category,
      categoria_nome: category.categoria_nome || 'Sem categoria',
      total_valor: categoryValue,
      total_transacoes: categoryTransactions,
      percentage: reportsApi.safeNumber(percentage),
      averagePerTransaction: reportsApi.safeNumber(averagePerTransaction),
    };
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              📊 Análise por Categorias
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Desempenho financeiro detalhado por categoria de transação
            </p>
          </div>
          <ExportButton
            data={categoriesWithPercentage}
            filename={`categorias_${new Date().toISOString().split('T')[0]}`}
            disabled={isLoading || categoriesWithPercentage.length === 0}
          />
        </div>
      </motion.div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        type="category"
      />

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredCategories.filter(c => c.tipo === 'receita').length} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredCategories.filter(c => c.tipo === 'despesa').length} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Principal</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-blue-600 truncate">
              {topCategoria?.categoria_nome || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategoria ? formatCurrency(reportsApi.safeNumber(topCategoria.total_valor)) : 'R$ 0,00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Categoria</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((totalReceitas + totalDespesas) / Math.max(totalCategorias, 1))}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportsApi.safeNumber(mediaTransacoesPorCategoria).toFixed(1)} transações/categoria
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Análise por Categorias</span>
              <Badge variant="secondary">
                {totalCategorias} categoria{totalCategorias === 1 ? '' : 's'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('categoria_nome')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Categoria
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('tipo')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Tipo
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('total_valor')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Total
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('total_transacoes')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Transações
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Média/Transação</TableHead>
                      <TableHead>% do Total</TableHead>
                      <TableHead>Participação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriesWithPercentage.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma categoria encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoriesWithPercentage.map((category) => {
                        const isReceita = category.tipo === 'receita';
                        const TypeIcon = isReceita ? TrendingUp : TrendingDown;

                        return (
                          <TableRow key={`${category.categoria_id}-${category.tipo}`}>
                            <TableCell className="font-medium">
                              <div className="max-w-[150px] truncate" title={category.categoria_nome}>
                                {category.categoria_nome}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isReceita ? 'default' : 'destructive'} className="flex items-center w-fit">
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {isReceita ? 'Receita' : 'Despesa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={isReceita ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(category.total_valor)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {category.total_transacoes}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(category.averagePerTransaction)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {formatPercentage(category.percentage)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Progress
                                  value={category.percentage}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Insights */}
      {categoriesWithPercentage.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Top Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-600">
                Top 5 Categorias de Despesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoriesWithPercentage
                  .filter(c => c.tipo === 'despesa')
                  .sort((a, b) => reportsApi.safeNumber(b.total_valor) - reportsApi.safeNumber(a.total_valor))
                  .slice(0, 5)
                  .map((category, index) => (
                    <div key={category.categoria_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{category.categoria_nome}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          {formatCurrency(category.total_valor)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPercentage(category.percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Revenue Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-600">
                Top 5 Categorias de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoriesWithPercentage
                  .filter(c => c.tipo === 'receita')
                  .sort((a, b) => reportsApi.safeNumber(b.total_valor) - reportsApi.safeNumber(a.total_valor))
                  .slice(0, 5)
                  .map((category, index) => (
                    <div key={category.categoria_id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{category.categoria_nome}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(category.total_valor)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPercentage(category.percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}