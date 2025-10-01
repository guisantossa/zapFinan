import { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../components/ui/sheet';
import { PlanFormStepper } from './PlanFormStepper';
import { Step1_BasicInfo } from './Step1_BasicInfo';
import { Step2_MainFeatures } from './Step2_MainFeatures';
import { Step3_AdvancedFeatures } from './Step3_AdvancedFeatures';
import { Step4_UsageLimits } from './Step4_UsageLimits';
import { Step5_ConfigAppearance } from './Step5_ConfigAppearance';
import { Step } from './types';
import { PlanResponse, PlanCreate, PlanUpdate } from '../../../services/plansApi';

interface PlanFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanResponse;
  onSubmit: (data: PlanCreate | PlanUpdate) => Promise<boolean | PlanResponse>;
}

const STEPS: Step[] = [
  { id: 1, name: 'Informações', description: 'Dados básicos do plano' },
  { id: 2, name: 'Recursos', description: 'Recursos principais' },
  { id: 3, name: 'Avançado', description: 'Recursos avançados' },
  { id: 4, name: 'Limites', description: 'Limites de uso' },
  { id: 5, name: 'Configuração', description: 'Aparência e config' },
];

export function PlanFormSheet({ open, onOpenChange, plan, onSubmit }: PlanFormSheetProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PlanCreate | PlanUpdate>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [isStepValid, setIsStepValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('PlanFormSheet - open:', open, 'plan:', plan);

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        nome: '',
        description: '',
        valor_mensal: 0,
        valor_anual: 0,
        color: 'blue',
        display_order: 0,
        transactions_enabled: true,
        budgets_enabled: true,
        commitments_enabled: true,
        reports_advanced: false,
        google_calendar_sync: false,
        multi_phone_enabled: false,
        api_access: false,
        priority_support: false,
        max_transactions_per_month: 100,
        max_budgets: 5,
        max_commitments: 10,
        max_categories: null,
        max_phones: 1,
        data_retention_months: 12,
        is_active: true,
        is_default: false,
      });
    }
  }, [plan, open]);

  useEffect(() => {
    setIsStepValid(false);
  }, [currentStep]);

  const updateFormData = (newData: Partial<PlanCreate | PlanUpdate>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (!isStepValid) return;
    const nextStep = currentStep + 1;
    setVisitedSteps((prev) => new Set(prev).add(nextStep));
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || visitedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData as PlanCreate | PlanUpdate);
      if (result) {
        onOpenChange(false);
        // Reset form
        setCurrentStep(1);
        setVisitedSteps(new Set([1]));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset on close
    setTimeout(() => {
      setCurrentStep(1);
      setVisitedSteps(new Set([1]));
      setFormData({});
    }, 300);
  };

  const renderStepContent = () => {
    const props = { formData, updateFormData, setIsValid: setIsStepValid };
    switch (currentStep) {
      case 1:
        return <Step1_BasicInfo {...props} />;
      case 2:
        return <Step2_MainFeatures {...props} />;
      case 3:
        return <Step3_AdvancedFeatures {...props} />;
      case 4:
        return <Step4_UsageLimits {...props} />;
      case 5:
        return <Step5_ConfigAppearance {...props} />;
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] sm:w-[80vw] max-w-none p-0 overflow-y-auto">
        <div className="flex flex-col h-full min-h-screen">
          {/* Header */}
          <div className="px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {plan ? `Editando: ${plan.nome}` : 'Criar Novo Plano'}
              </SheetTitle>
              <SheetDescription className="text-sm text-gray-600 dark:text-gray-400">
                {STEPS[currentStep - 1].description}
              </SheetDescription>
            </SheetHeader>
          </div>

          {/* Stepper */}
          <div className="px-8 pt-6">
            <PlanFormStepper
              steps={STEPS}
              currentStep={currentStep}
              visitedSteps={visitedSteps}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Content */}
          <div className="flex-1 px-8 py-6 overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>

              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepValid}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid || isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Salvar Plano
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}