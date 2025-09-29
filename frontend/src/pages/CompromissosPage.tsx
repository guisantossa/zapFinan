import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Commitment, CommitmentStats } from '../types/commitment';
import { commitmentApi } from '../services/commitmentApi';
import { PremiumSummaryCard } from '../components/dashboard/PremiumSummaryCard';
import { CommitmentTable } from '../components/commitments/CommitmentTable';
import { CommitmentFormModal } from '../components/commitments/CommitmentFormModal';
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

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function CompromissosPage() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [stats, setStats] = useState<CommitmentStats>({
    total_compromissos: 0,
    compromissos_hoje: 0,
    compromissos_semana: 0,
    compromissos_vencidos: 0,
    compromissos_concluidos: 0,
    compromissos_agendados: 0,
    compromissos_por_tipo: {
      reuniao: 0,
      pagamento: 0,
      evento: 0,
      lembrete: 0,
      aniversario: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [commitmentToDelete, setCommitmentToDelete] = useState<Commitment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCommitments();
      loadStats();
    }
  }, [user]);

  const loadCommitments = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const commitmentsData = await commitmentApi.getCommitments(user.id);
      setCommitments(commitmentsData);
    } catch (error: any) {
      console.error('Error loading commitments:', error);
      toast.error('Erro ao carregar compromissos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;

    try {
      setIsStatsLoading(true);
      const statsData = await commitmentApi.getCommitmentStats(user.id);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleNewCommitment = () => {
    setSelectedCommitment(null);
    setIsFormModalOpen(true);
  };

  const handleEditCommitment = (commitment: Commitment) => {
    setSelectedCommitment(commitment);
    setIsFormModalOpen(true);
  };

  const handleDeleteCommitment = (commitment: Commitment) => {
    setCommitmentToDelete(commitment);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!commitmentToDelete) return;

    try {
      setIsDeleting(true);
      await commitmentApi.deleteCommitment(commitmentToDelete.id);
      toast.success('Compromisso excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setCommitmentToDelete(null);
      await loadCommitments();
      await loadStats();
    } catch (error: any) {
      console.error('Error deleting commitment:', error);
      toast.error('Erro ao excluir compromisso');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = async () => {
    await loadCommitments();
    await loadStats();
  };

  const handleViewCommitment = (commitment: Commitment) => {
    // You can implement a detailed view modal here
    console.log('View commitment:', commitment);
  };

  const handleMarkCompleted = async (commitment: Commitment) => {
    try {
      await commitmentApi.markAsCompleted(commitment.id);
      toast.success('Compromisso marcado como concluído!');
      await loadCommitments();
      await loadStats();
    } catch (error: any) {
      console.error('Error marking commitment as completed:', error);
      toast.error('Erro ao marcar compromisso como concluído');
    }
  };

  const handleMarkCancelled = async (commitment: Commitment) => {
    try {
      await commitmentApi.markAsCancelled(commitment.id);
      toast.success('Compromisso cancelado!');
      await loadCommitments();
      await loadStats();
    } catch (error: any) {
      console.error('Error marking commitment as cancelled:', error);
      toast.error('Erro ao cancelar compromisso');
    }
  };

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
          Compromissos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie lembretes e compromissos financeiros
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
          onClick={handleNewCommitment}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Compromisso
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
          title="Hoje"
          value={stats.compromissos_hoje.toString()}
          icon={Calendar}
          color="blue"
          trend={{
            value: stats.compromissos_hoje > 0 ? "Atenção aos horários" : "Nenhum compromisso",
            isPositive: stats.compromissos_hoje === 0
          }}
          delay={0}
        />
        <PremiumSummaryCard
          title="Esta Semana"
          value={stats.compromissos_semana.toString()}
          icon={Clock}
          color="purple"
          trend={{
            value: `${stats.compromissos_agendados} agendados`,
            isPositive: stats.compromissos_agendados > 0
          }}
          delay={0.1}
        />
        <PremiumSummaryCard
          title="Vencidos"
          value={stats.compromissos_vencidos.toString()}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: stats.compromissos_vencidos > 0 ? "Requer atenção" : "Tudo em dia",
            isPositive: stats.compromissos_vencidos === 0
          }}
          delay={0.2}
        />
        <PremiumSummaryCard
          title="Concluídos"
          value={stats.compromissos_concluidos.toString()}
          icon={CheckCircle}
          color="green"
          trend={{
            value: `${Math.round((stats.compromissos_concluidos / Math.max(stats.total_compromissos, 1)) * 100)}% do total`,
            isPositive: true
          }}
          delay={0.3}
        />
      </motion.div>

      {/* Commitment Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <CommitmentTable
          commitments={commitments}
          isLoading={isLoading}
          onEditCommitment={handleEditCommitment}
          onDeleteCommitment={handleDeleteCommitment}
          onViewCommitment={handleViewCommitment}
          onMarkCompleted={handleMarkCompleted}
          onMarkCancelled={handleMarkCancelled}
        />
      </motion.div>

      {/* Form Modal */}
      <CommitmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        commitment={selectedCommitment}
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
                  Excluir Compromisso
                </AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir o compromisso "{commitmentToDelete?.titulo}"?
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