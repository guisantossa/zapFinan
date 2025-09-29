import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpDown, TrendingUp, TrendingDown, Receipt, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { ReportFilters, FilterState } from './ReportFilters';
import { ExportButton } from './ExportButton';
import { reportsApi, Transaction, PaginatedTransactions, TransactionStats } from '../../services/reportsApi';
import { toast } from 'sonner';

interface TransactionReportProps {
  className?: string;
}

export function TransactionReport({ className = '' }: TransactionReportProps) {
  const [transactions, setTransactions] = useState<PaginatedTransactions | null>(null);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('data_transacao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [filters, currentPage]);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await reportsApi.getTransactions({
        ...filters,
        page: currentPage,
        size: 20,
      });
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reportsApi.getTransactionStats(
        filters.data_inicio,
        filters.data_fim
      );
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedTransactions = () => {
    if (!transactions?.items) return [];

    let filteredItems = transactions.items;

    // Apply search filter
    if (searchTerm) {
      filteredItems = filteredItems.filter(transaction =>
        transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.categoria?.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return [...filteredItems].sort((a, b) => {
      let aValue = a[sortField as keyof Transaction];
      let bValue = b[sortField as keyof Transaction];

      if (sortField === 'categoria_nome') {
        aValue = a.categoria?.nome || '';
        bValue = b.categoria?.nome || '';
      }

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
  };

  const getTypeVariant = (tipo: string) => {
    return tipo === 'receita' ? 'default' : 'destructive';
  };

  const getTypeIcon = (tipo: string) => {
    return tipo === 'receita' ? TrendingUp : TrendingDown;
  };

  const formatCurrency = (value: number) => {
    return reportsApi.formatCurrency(value);
  };

  const formatDate = (dateString: string) => {
    return reportsApi.formatDate(dateString);
  };

  const sortedTransactions = getSortedTransactions();

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
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              📊 Relatório de Transações
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visualize e analise todas as suas transações financeiras
            </p>
          </div>
          <ExportButton
            data={sortedTransactions}
            filename={`transacoes_${new Date().toISOString().split('T')[0]}`}
            disabled={isLoading || sortedTransactions.length === 0}
          />
        </div>
      </motion.div>

      {/* Filters */}
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        type="transaction"
      />

      {/* Statistics Cards */}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <Receipt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.saldo)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
              <Receipt className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_transacoes}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Pesquisar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transações</span>
              {transactions && (
                <Badge variant="secondary">
                  {transactions.total} transaç{transactions.total === 1 ? 'ão' : 'ões'}
                </Badge>
              )}
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
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('data_transacao')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Data
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('descricao')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Descrição
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
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('valor')}
                          className="h-8 data-[state=open]:bg-accent"
                        >
                          Valor
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Nenhuma transação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTransactions.map((transaction) => {
                        const TypeIcon = getTypeIcon(transaction.tipo);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {formatDate(transaction.data_transacao)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate" title={transaction.descricao}>
                                {transaction.descricao}
                              </div>
                            </TableCell>
                            <TableCell>
                              {transaction.categoria?.nome || 'Sem categoria'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTypeVariant(transaction.tipo)} className="flex items-center w-fit">
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {transaction.tipo === 'receita' ? 'Receita' : 'Despesa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span className={transaction.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(transaction.valor)}
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

      {/* Pagination */}
      {transactions && transactions.pages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="text-sm text-gray-500">
            Página {transactions.page} de {transactions.pages}
            ({transactions.total} transaç{transactions.total === 1 ? 'ão' : 'ões'})
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(transactions.pages, currentPage + 1))}
              disabled={currentPage === transactions.pages || isLoading}
            >
              Próxima
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}