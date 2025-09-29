import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
import { PiggyBank, Trash2, Plus, Target, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { Budget, BudgetStats } from '../types/budget';
import { budgetApi } from '../services/budgetApi';
import { PremiumSummaryCard } from '../components/dashboard/PremiumSummaryCard';
import { BudgetTable } from '../components/budgets/BudgetTable';
import { BudgetFormModal } from '../components/budgets/BudgetFormModal';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
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

export function OrcamentosPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<BudgetStats>({
    total_budgets: 0,
    active_budgets: 0,
    budgets_near_limit: 0,
    total_allocated: 0,
    total_spent: 0,
    budgets_exceeded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBudgets();
      loadStats();
    }
  }, [user]);

  const loadBudgets = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const budgetsData = await budgetApi.getBudgetSummaries(user.id);
      setBudgets(budgetsData as Budget[]);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      setIsStatsLoading(true);
      const statsData = await budgetApi.getBudgetStats(user.id);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleNewBudget = () => {
    setSelectedBudget(null);
    setIsFormModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsFormModalOpen(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setBudgetToDelete(budget);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;

    try {
      setIsDeleting(true);
      await budgetApi.deleteBudget(budgetToDelete.id);
      toast.success('Orçamento excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setBudgetToDelete(null);
      await loadBudgets();
      await loadStats();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast.error('Erro ao excluir orçamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = async () => {
    await loadBudgets();
    await loadStats();
  };

  const handleViewBudget = (budget: Budget) => {
    // You can implement a detailed view modal here
    console.log('View budget:', budget);
  };

  const handleRecalculateBudgets = async () => {
    if (!user?.id) return;

    try {
      setIsRecalculating(true);
      const result = await budgetApi.recalculateUserBudgets(user.id);

      toast.success(`Orçamentos recalculados! ${result.orcamentos_atualizados} períodos atualizados`);

      // Recarregar dados
      await loadBudgets();
      await loadStats();
    } catch (error: any) {
      console.error('Error recalculating budgets:', error);
      toast.error('Erro ao recalcular orçamentos');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
          Controle de Orçamentos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie seus orçamentos e monitore seus gastos em tempo real
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex items-center justify-end space-x-3 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Button
          onClick={handleRecalculateBudgets}
          disabled={isRecalculating}
          variant="outline"
          className="rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/70 dark:hover:bg-slate-700/70"
        >
          {isRecalculating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              Recalculando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalcular
            </>
          )}
        </Button>

        <Button
          onClick={handleNewBudget}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
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
          title="Total de Orçamentos"
          value={stats.total_budgets.toString()}
          icon={PiggyBank}
          color="blue"
          delay={0}
        />

        <PremiumSummaryCard
          title="Orçamentos Ativos"
          value={stats.active_budgets.toString()}
          icon={Target}
          color="green"
          trend={{
            value: `${stats.active_budgets}/${stats.total_budgets}`,
            isPositive: stats.active_budgets > 0
          }}
          delay={0.1}
        />

        <PremiumSummaryCard
          title="Próximos ao Limite"
          value={stats.budgets_near_limit.toString()}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: `${Math.round((stats.budgets_near_limit / Math.max(stats.total_budgets, 1)) * 100)}%`,
            isPositive: false
          }}
          delay={0.2}
        />

        <PremiumSummaryCard
          title="Valor Total Alocado"
          value={new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(stats.total_allocated)}
          icon={TrendingUp}
          color="purple"
          trend={{
            value: `${Math.round((stats.total_spent / Math.max(stats.total_allocated, 1)) * 100)}% gasto`,
            isPositive: stats.total_spent < stats.total_allocated
          }}
          delay={0.3}
        />
      </motion.div>

      {/* Budget Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <BudgetTable
          budgets={budgets}
          isLoading={isLoading}
          onEditBudget={handleEditBudget}
          onDeleteBudget={handleDeleteBudget}
          onViewBudget={handleViewBudget}
        />
      </motion.div>

      {/* Form Modal */}
      <BudgetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        budget={selectedBudget}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
          <AlertDialogHeader>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Excluir Orçamento
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir o orçamento "{budgetToDelete?.nome}"?
              <br />
              <span className="text-sm font-medium text-red-600 dark:text-red-400 mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-700/50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
            >
              {isDeleting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}