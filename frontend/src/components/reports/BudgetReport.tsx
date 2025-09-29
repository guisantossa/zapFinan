import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpDown, Wallet, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { ReportFilters, FilterState } from './ReportFilters';
import { ExportButton } from './ExportButton';
import { reportsApi, BudgetSummary } from '../../services/reportsApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface BudgetReportProps {
  className?: string;
}

export function BudgetReport({ className = '' }: BudgetReportProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<BudgetSummary[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('percentual_gasto');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user?.id) {
      loadBudgets();
    }
  }, [user?.id]);

  useEffect(() => {
    applyFilters();
  }, [budgets, filters]);

  const loadBudgets = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setIsLoading(true);
      const data = await reportsApi.getBudgetsSummary(user.id);
      setBudgets(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...budgets];

    // Filter by category
    if (filters.categoria_id) {
      filtered = filtered.filter(budget => budget.categoria_id === filters.categoria_id);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(budget => {
        switch (filters.status) {
          case 'dentro_limite':
            return budget.percentual_gasto < 80;
          case 'proximo_limite':
            return budget.percentual_gasto >= 80 && budget.percentual_gasto < 100;
          case 'excedeu_limite':
            return budget.percentual_gasto >= 100;
          default:
            return true;
        }
      });
    }

    // Filter by periodicidade
    if (filters.periodicidade) {
      filtered = filtered.filter(budget => budget.periodicidade === filters.periodicidade);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField as keyof BudgetSummary];
      let bValue = b[sortField as keyof BudgetSummary];

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

    setFilteredBudgets(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusInfo = (percentual: number) => {
    if (percentual >= 100) {
      return {
        status: 'Excedeu',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600',
      };
    } else if (percentual >= 80) {
      return {
        status: 'Próximo',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
      };
    } else {
      return {
        status: 'Normal',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
      };
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return 'bg-red-500';
    if (percentual >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (value: number) => {
    return reportsApi.formatCurrency(value);
  };

  const formatPercentage = (value: number) => {
    return reportsApi.formatPercentage(value);
  };

  // Calculate summary statistics
  const totalBudgets = filteredBudgets.length;
  const activeBudgets = filteredBudgets.filter(b => b.ativo).length;
  const exceededBudgets = filteredBudgets.filter(b => reportsApi.safeNumber(b.percentual_gasto) >= 100).length;
  const nearLimitBudgets = filteredBudgets.filter(b => {
    const percentage = reportsApi.safeNumber(b.percentual_gasto);
    return percentage >= 80 && percentage < 100;
  }).length;
  const totalLimite = filteredBudgets.reduce((sum, b) => sum + reportsApi.safeNumber(b.valor_limite), 0);
  const totalGasto = filteredBudgets.reduce((sum, b) => sum + reportsApi.safeNumber(b.valor_gasto), 0);
  const averageUsage = totalBudgets > 0 && totalLimite > 0 ? (totalGasto / totalLimite) * 100 : 0;

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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              💰 Relatório de Orçamentos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Acompanhe o desempenho e status dos seus orçamentos
            </p>
          </div>
          <ExportButton
            data={filteredBudgets}
            filename={`orcamentos_${new Date().toISOString().split('T')[0]}`}
            disabled={isLoading || filteredBudgets.length === 0}
          />
        </div>
      </motion.div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        type="budget"
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
            <CardTitle className="text-sm font-medium">Total de Orçamentos</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBudgets}</div>
            <p className="text-xs text-muted-foreground">
              {activeBudgets} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Excedidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{exceededBudgets}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudgets > 0 ? Math.round((exceededBudgets / totalBudgets) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos do Limite</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{nearLimitBudgets}</div>
            <p className="text-xs text-muted-foreground">
              80-99% utilizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilização Média</CardTitle>
            <Wallet className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(averageUsage)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalGasto)} de {formatCurrency(totalLimite)}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budgets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orçamentos</span>
              <Badge variant="secondary">
                {totalBudgets} orçamento{totalBudgets === 1 ? '' : 's'}
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
                          onClick={() => handleSort('nome')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Nome
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
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
                          onClick={() => handleSort('periodicidade')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Periodicidade
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('valor_limite')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Limite
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('valor_gasto')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Gasto
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('percentual_gasto')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Progresso
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('dias_restantes')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Dias Restantes
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBudgets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhum orçamento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBudgets.map((budget) => {
                        const statusInfo = getStatusInfo(budget.percentual_gasto);
                        const StatusIcon = statusInfo.icon;

                        return (
                          <TableRow key={budget.id}>
                            <TableCell className="font-medium">
                              <div className="max-w-[150px] truncate" title={budget.nome}>
                                {budget.nome}
                              </div>
                            </TableCell>
                            <TableCell>
                              {budget.categoria_nome || 'Sem categoria'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {budget.periodicidade === 'mensal' ? 'Mensal' : 'Anual'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(budget.valor_limite)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={statusInfo.color}>
                                {formatCurrency(budget.valor_gasto)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">
                                    {formatPercentage(budget.percentual_gasto)}
                                  </span>
                                </div>
                                <Progress
                                  value={Math.min(budget.percentual_gasto, 100)}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusInfo.variant} className="flex items-center w-fit">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={budget.dias_restantes <= 7 ? 'text-red-600 font-medium' : ''}>
                                {budget.dias_restantes} dias
                              </span>
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
    </div>
  );
}