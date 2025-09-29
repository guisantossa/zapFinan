import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, TrendingDown, Wallet, DollarSign, Calculator, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { ReportFilters, FilterState } from './ReportFilters';
import { ExportButton } from './ExportButton';
import { reportsApi, TransactionStats, CategorySummary } from '../../services/reportsApi';
import { toast } from 'sonner';

interface FinancialSummaryReportProps {
  className?: string;
}

interface PeriodComparison {
  current: TransactionStats;
  previous: TransactionStats;
  growth: {
    receitas: number;
    despesas: number;
    saldo: number;
    transacoes: number;
  };
}

export function FinancialSummaryReport({ className = '' }: FinancialSummaryReportProps) {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load current period stats
      const currentStats = await reportsApi.getTransactionStats(
        filters.data_inicio,
        filters.data_fim
      );
      setStats(currentStats);

      // Load categories summary
      const categoriesData = await reportsApi.getCategoriesSummary(
        filters.data_inicio,
        filters.data_fim
      );
      setCategories(categoriesData);

      // Load previous period for comparison (if dates are specified)
      if (filters.data_inicio && filters.data_fim) {
        await loadComparison(currentStats);
      }

    } catch (error) {
      console.error('Erro ao carregar resumo financeiro:', error);
      toast.error('Erro ao carregar resumo financeiro');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComparison = async (currentStats: TransactionStats) => {
    try {
      if (!filters.data_inicio || !filters.data_fim) return;

      const startDate = new Date(filters.data_inicio);
      const endDate = new Date(filters.data_fim);
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate previous period dates
      const previousEndDate = new Date(startDate.getTime() - 1000 * 60 * 60 * 24);
      const previousStartDate = new Date(previousEndDate.getTime() - (periodDays * 1000 * 60 * 60 * 24));

      const previousStats = await reportsApi.getTransactionStats(
        previousStartDate.toISOString().split('T')[0],
        previousEndDate.toISOString().split('T')[0]
      );

      // Calculate growth rates
      const growth = {
        receitas: calculateGrowth(currentStats.total_receitas, previousStats.total_receitas),
        despesas: calculateGrowth(currentStats.total_despesas, previousStats.total_despesas),
        saldo: calculateGrowth(currentStats.saldo, previousStats.saldo),
        transacoes: calculateGrowth(currentStats.total_transacoes, previousStats.total_transacoes),
      };

      setComparison({
        current: currentStats,
        previous: previousStats,
        growth,
      });

    } catch (error) {
      console.error('Erro ao carregar comparação de períodos:', error);
    }
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const formatCurrency = (value: number) => {
    return reportsApi.formatCurrency(value);
  };

  const formatPercentage = (value: number) => {
    return reportsApi.formatPercentage(value);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  // Get top categories
  const topExpenseCategories = categories
    .filter(c => c.tipo === 'despesa')
    .sort((a, b) => b.total_valor - a.total_valor)
    .slice(0, 5);

  const topRevenueCategories = categories
    .filter(c => c.tipo === 'receita')
    .sort((a, b) => b.total_valor - a.total_valor)
    .slice(0, 5);

  // Prepare export data
  const exportData = [
    {
      Métrica: 'Total de Receitas',
      Valor: stats?.total_receitas || 0,
      'Período Anterior': comparison?.previous.total_receitas || 0,
      Crescimento: comparison?.growth.receitas || 0,
    },
    {
      Métrica: 'Total de Despesas',
      Valor: stats?.total_despesas || 0,
      'Período Anterior': comparison?.previous.total_despesas || 0,
      Crescimento: comparison?.growth.despesas || 0,
    },
    {
      Métrica: 'Saldo',
      Valor: stats?.saldo || 0,
      'Período Anterior': comparison?.previous.saldo || 0,
      Crescimento: comparison?.growth.saldo || 0,
    },
    {
      Métrica: 'Total de Transações',
      Valor: stats?.total_transacoes || 0,
      'Período Anterior': comparison?.previous.total_transacoes || 0,
      Crescimento: comparison?.growth.transacoes || 0,
    },
    ...topExpenseCategories.map(cat => ({
      Métrica: `Despesa - ${cat.categoria_nome}`,
      Valor: cat.total_valor,
      'Período Anterior': '',
      Crescimento: '',
    })),
    ...topRevenueCategories.map(cat => ({
      Métrica: `Receita - ${cat.categoria_nome}`,
      Valor: cat.total_valor,
      'Período Anterior': '',
      Crescimento: '',
    })),
  ];

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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              📈 Resumo Financeiro Personalizado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visão completa da sua situação financeira com comparativos e tendências
            </p>
          </div>
          <ExportButton
            data={exportData}
            filename={`resumo_financeiro_${new Date().toISOString().split('T')[0]}`}
            disabled={isLoading || !stats}
          />
        </div>
      </motion.div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        type="summary"
      />

      {/* Main Financial Metrics */}
      {stats && (
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
                {formatCurrency(stats.total_receitas)}
              </div>
              {comparison && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={getGrowthColor(comparison.growth.receitas)}>
                    {comparison.growth.receitas >= 0 ? '+' : ''}{formatPercentage(comparison.growth.receitas)}
                  </span>
                  <span>vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.total_despesas)}
              </div>
              {comparison && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={getGrowthColor(comparison.growth.despesas)}>
                    {comparison.growth.despesas >= 0 ? '+' : ''}{formatPercentage(comparison.growth.despesas)}
                  </span>
                  <span>vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.saldo)}
              </div>
              {comparison && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={getGrowthColor(comparison.growth.saldo)}>
                    {comparison.growth.saldo >= 0 ? '+' : ''}{formatPercentage(comparison.growth.saldo)}
                  </span>
                  <span>vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              <Calculator className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_transacoes}
              </div>
              {comparison && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <span className={getGrowthColor(comparison.growth.transacoes)}>
                    {comparison.growth.transacoes >= 0 ? '+' : ''}{formatPercentage(comparison.growth.transacoes)}
                  </span>
                  <span>vs período anterior</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Financial Health Indicators */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Taxa de Poupança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Saldo / Receitas</span>
                  <span className="font-semibold">
                    {stats.total_receitas > 0
                      ? formatPercentage((stats.saldo / stats.total_receitas) * 100)
                      : '0%'
                    }
                  </span>
                </div>
                <Progress
                  value={Math.max(0, stats.total_receitas > 0 ? (stats.saldo / stats.total_receitas) * 100 : 0)}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Meta recomendada: 20% ou mais
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Relação Despesa/Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Despesas / Receitas</span>
                  <span className="font-semibold">
                    {stats.total_receitas > 0
                      ? formatPercentage((stats.total_despesas / stats.total_receitas) * 100)
                      : '0%'
                    }
                  </span>
                </div>
                <Progress
                  value={stats.total_receitas > 0 ? (stats.total_despesas / stats.total_receitas) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Meta recomendada: Abaixo de 80%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_transacoes > 0
                    ? formatCurrency((stats.total_receitas + stats.total_despesas) / stats.total_transacoes)
                    : formatCurrency(0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por transação
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Period Comparison Table */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Períodos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrica</TableHead>
                      <TableHead className="text-right">Período Atual</TableHead>
                      <TableHead className="text-right">Período Anterior</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-center">Crescimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Receitas</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {formatCurrency(comparison.current.total_receitas)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(comparison.previous.total_receitas)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(comparison.current.total_receitas - comparison.previous.total_receitas)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comparison.growth.receitas >= 0 ? 'default' : 'destructive'}>
                          {comparison.growth.receitas >= 0 ? '+' : ''}{formatPercentage(comparison.growth.receitas)}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Despesas</TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        {formatCurrency(comparison.current.total_despesas)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(comparison.previous.total_despesas)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(comparison.current.total_despesas - comparison.previous.total_despesas)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comparison.growth.despesas <= 0 ? 'default' : 'destructive'}>
                          {comparison.growth.despesas >= 0 ? '+' : ''}{formatPercentage(comparison.growth.despesas)}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Saldo</TableCell>
                      <TableCell className={`text-right font-semibold ${comparison.current.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(comparison.current.saldo)}
                      </TableCell>
                      <TableCell className={`text-right ${comparison.previous.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(comparison.previous.saldo)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(comparison.current.saldo - comparison.previous.saldo)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comparison.growth.saldo >= 0 ? 'default' : 'destructive'}>
                          {comparison.growth.saldo >= 0 ? '+' : ''}{formatPercentage(comparison.growth.saldo)}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Transações</TableCell>
                      <TableCell className="text-right font-semibold">
                        {comparison.current.total_transacoes}
                      </TableCell>
                      <TableCell className="text-right">
                        {comparison.previous.total_transacoes}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {comparison.current.total_transacoes - comparison.previous.total_transacoes}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={comparison.growth.transacoes >= 0 ? 'default' : 'destructive'}>
                          {comparison.growth.transacoes >= 0 ? '+' : ''}{formatPercentage(comparison.growth.transacoes)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Categories Summary */}
      {(topExpenseCategories.length > 0 || topRevenueCategories.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Top Expense Categories */}
          {topExpenseCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-red-600">
                  Top 5 Categorias de Despesa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topExpenseCategories.map((category, index) => {
                    const percentage = stats && stats.total_despesas > 0
                      ? (category.total_valor / stats.total_despesas) * 100
                      : 0;

                    return (
                      <div key={category.categoria_id} className="space-y-2">
                        <div className="flex items-center justify-between">
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
                              {formatPercentage(percentage)}
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Revenue Categories */}
          {topRevenueCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-600">
                  Top 5 Categorias de Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRevenueCategories.map((category, index) => {
                    const percentage = stats && stats.total_receitas > 0
                      ? (category.total_valor / stats.total_receitas) * 100
                      : 0;

                    return (
                      <div key={category.categoria_id} className="space-y-2">
                        <div className="flex items-center justify-between">
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
                              {formatPercentage(percentage)}
                            </div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}