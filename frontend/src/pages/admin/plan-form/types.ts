import { PlanCreate, PlanUpdate } from '../../../services/plansApi';

export interface StepProps {
  formData: Partial<PlanCreate | PlanUpdate>;
  updateFormData: (data: Partial<PlanCreate | PlanUpdate>) => void;
  setIsValid: (valid: boolean) => void;
}

export interface Step {
  id: number;
  name: string;
  description: string;
}