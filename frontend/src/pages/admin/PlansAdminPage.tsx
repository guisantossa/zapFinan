import { useEffect, useState } from 'react';
import { Plus, Loader2, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { PlanAdminRow } from '../../components/admin/PlanAdminRow';
import { usePlansAdmin } from '../../hooks/usePlansAdmin';
import { PlanFormModal } from './plan-form/PlanFormModal';
import { PlanResponse, PlanCreate, PlanUpdate } from '../../services/plansApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export default function PlansAdminPage() {
  const {
    plans,
    isLoading,
    includeInactive,
    setIncludeInactive,
    loadPlans,
    createPlan,
    updatePlan,
    activatePlan,
    deactivatePlan,
    setDefaultPlan,
    deletePlan,
  } = usePlansAdmin();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | undefined>();
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreateClick = () => {
    console.log('handleCreateClick chamado');
    setEditingPlan(undefined);
    setIsFormOpen(true);
    console.log('isFormOpen setado para true');
  };

  const handleEditClick = (plan: PlanResponse) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: PlanCreate | PlanUpdate) => {
    if (editingPlan) {
      await updatePlan(editingPlan.id, data);
      return true;
    } else {
      return await createPlan(data as PlanCreate);
    }
  };

  const handleDeleteClick = (planId: number) => {
    setDeletingPlanId(planId);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPlanId) {
      await deletePlan(deletingPlanId);
      setDeletingPlanId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Gerenciar Planos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure os planos de assinatura disponíveis
            </p>
          </div>

          <Button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Switch
              id="includeInactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <Label htmlFor="includeInactive" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              Mostrar planos inativos
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100">
              {plans.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              plano{plans.length !== 1 ? 's' : ''} {includeInactive ? 'total' : 'ativo'}
              {plans.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Carregando planos...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[450px] text-center">
          <div className="mb-6 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhum plano encontrado
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {includeInactive
              ? 'Não há planos cadastrados no sistema'
              : 'Não há planos ativos. Ative um plano existente ou crie um novo'}
          </p>
          <Button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Plano
          </Button>
        </div>
      )}

      {/* Plans Table */}
      {!isLoading && plans.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="py-3 px-6 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="py-3 px-6 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Recursos
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Limites
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <PlanAdminRow
                    key={plan.id}
                    plan={plan}
                    index={index}
                    onEdit={handleEditClick}
                    onActivate={activatePlan}
                    onDeactivate={deactivatePlan}
                    onSetDefault={setDefaultPlan}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      <PlanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        plan={editingPlan}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingPlanId !== null} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.
              {plans.find(p => p.id === deletingPlanId)?.is_default && (
                <span className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  <span>⚠️</span>
                  <span>Atenção: Este é o plano padrão. Defina outro plano como padrão antes de excluir.</span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}