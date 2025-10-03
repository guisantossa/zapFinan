import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Plus, List, Grid, Download, Filter as FilterIcon, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { PremiumSummaryCard } from '../components/dashboard/PremiumSummaryCard';
import {
  TransactionStats,
  TransactionFilters,
  TransactionCard,
  TransactionTable,
  TransactionListSkeleton
} from '../components/transactions';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionFilters } from '../hooks/useTransactionFilters';
import { useTransactionStats } from '../hooks/useTransactionStats';
import type { Transaction, TransactionCreate, TransactionUpdate } from '../types/transaction';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

type ViewMode = 'grid' | 'table';

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function TransacoesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Hooks for data management
  const {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
  } = useTransactionFilters();

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateParams,
  } = useTransactions();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useTransactionStats({
    data_inicio: filters.data_inicio,
    data_fim: filters.data_fim,
  });

  // Update transaction params when filters change
  useEffect(() => {
    updateParams({
      ...filters,
      page: 1, // Reset to first page when filters change
    });
  }, [filters]); // Remove updateParams dependency to prevent loops

  // Handle creating transaction
  const handleCreateTransaction = async (data: TransactionCreate) => {
    setIsFormLoading(true);
    try {
      await createTransaction(data);
      setIsFormOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle updating transaction
  const handleUpdateTransaction = async (data: TransactionUpdate) => {
    if (!editingTransaction) return;

    setIsFormLoading(true);
    try {
      await updateTransaction(editingTransaction.id, data);
      setIsFormOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle deleting transaction
  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction(deletingTransaction.id);
      setIsDeleteDialogOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Open edit form
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  if (transactionsLoading && !transactions) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
            Transações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas receitas e despesas
          </p>
        </div>

        <TransactionListSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
          Transações
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas receitas e despesas
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex items-center justify-end space-x-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* View Toggle */}
        <div className="flex rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-lg"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="rounded-lg"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <Button
          onClick={() => setIsFormOpen(true)}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Transação
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <PremiumSummaryCard
          title="Receitas do Mês"
          value={stats ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_receitas) : "R$ 0,00"}
          icon={TrendingUp}
          color="green"
          trend={{ value: `${stats?.receitas || 0} transações`, isPositive: true }}
          delay={0}
        />
        <PremiumSummaryCard
          title="Despesas do Mês"
          value={stats ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total_despesas) : "R$ 0,00"}
          icon={TrendingDown}
          color="red"
          trend={{ value: `${stats?.despesas || 0} transações`, isPositive: false }}
          delay={0.1}
        />
        <PremiumSummaryCard
          title="Saldo Líquido"
          value={stats ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.saldo) : "R$ 0,00"}
          icon={DollarSign}
          color={stats && stats.saldo >= 0 ? "green" : "red"}
          trend={{ value: stats && stats.saldo >= 0 ? "Positivo" : "Negativo", isPositive: stats ? stats.saldo >= 0 : true }}
          delay={0.2}
        />
        <PremiumSummaryCard
          title="Total Transações"
          value={stats ? (stats.receitas + stats.despesas).toString() : "0"}
          icon={CreditCard}
          color="purple"
          trend={{ value: transactions ? `${transactions.total} total` : "0 total", isPositive: true }}
          delay={0.3}
        />
      </motion.div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {transactions && (
              <TransactionTable
                data={transactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteClick}
                onPageChange={(page) => updateParams({ page })}
                isLoading={transactionsLoading}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {transactions?.items.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteClick}
              />
            ))}

            {/* Pagination for grid view */}
            {transactions && transactions.total > transactions.size && (
              <div className="flex justify-center pt-6">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => updateParams({ page: transactions.page - 1 })}
                    disabled={transactions.page === 1}
                    className="rounded-xl"
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Página {transactions.page} de {Math.ceil(transactions.total / transactions.size)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => updateParams({ page: transactions.page + 1 })}
                    disabled={transactions.page >= Math.ceil(transactions.total / transactions.size)}
                    className="rounded-xl"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        transaction={editingTransaction}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        isLoading={isFormLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a transação "{deletingTransaction?.descricao}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}