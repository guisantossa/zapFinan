import { useState, useCallback } from 'react';
import { plansApi, PlanResponse, PlanCreate, PlanUpdate } from '../services/plansApi';
import { toast } from 'sonner';

export function usePlansAdmin() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await plansApi.adminGetAllPlans(includeInactive);
      setPlans(data);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast.error(error.response?.data?.detail || 'Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  }, [includeInactive]);

  const createPlan = async (planData: PlanCreate): Promise<boolean> => {
    try {
      const newPlan = await plansApi.adminCreatePlan(planData);
      setPlans(prev => [...prev, newPlan]);
      toast.success('Plano criado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao criar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar plano');
      return false;
    }
  };

  const updatePlan = async (planId: number, planData: PlanUpdate): Promise<boolean> => {
    try {
      const updatedPlan = await plansApi.adminUpdatePlan(planId, planData);
      setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      toast.success('Plano atualizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar plano');
      return false;
    }
  };

  const activatePlan = async (planId: number): Promise<void> => {
    try {
      const updatedPlan = await plansApi.adminActivatePlan(planId);
      setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      toast.success('Plano ativado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao ativar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao ativar plano');
    }
  };

  const deactivatePlan = async (planId: number): Promise<void> => {
    try {
      const updatedPlan = await plansApi.adminDeactivatePlan(planId);
      setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
      toast.success('Plano desativado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao desativar plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao desativar plano');
    }
  };

  const setDefaultPlan = async (planId: number): Promise<void> => {
    try {
      const updatedPlan = await plansApi.adminSetDefaultPlan(planId);
      // Update all plans: remove default from others, set on this one
      setPlans(prev => prev.map(p => ({
        ...p,
        is_default: p.id === planId
      })));
      toast.success('Plano padrão definido com sucesso!');
    } catch (error: any) {
      console.error('Erro ao definir plano padrão:', error);
      toast.error(error.response?.data?.detail || 'Erro ao definir plano padrão');
    }
  };

  const deletePlan = async (planId: number): Promise<void> => {
    try {
      await plansApi.adminDeletePlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plano excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      toast.error(error.response?.data?.detail || 'Erro ao excluir plano');
    }
  };

  return {
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
  };
}