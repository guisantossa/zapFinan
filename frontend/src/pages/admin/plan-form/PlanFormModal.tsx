import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Loader2, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { PlanFormStepper } from './PlanFormStepper';
import { Step1_BasicInfo } from './Step1_BasicInfo';
import { Step2_MainFeatures } from './Step2_MainFeatures';
import { Step3_AdvancedFeatures } from './Step3_AdvancedFeatures';
import { Step4_UsageLimits } from './Step4_UsageLimits';
import { Step5_ConfigAppearance } from './Step5_ConfigAppearance';
import { Step } from './types';
import { PlanResponse, PlanCreate, PlanUpdate } from '../../../services/plansApi';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const DEFAULT_FORM_DATA: Partial<PlanCreate | PlanUpdate> = {
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
};

export function PlanFormModal({ isOpen, onClose, plan, onSubmit }: PlanFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PlanCreate | PlanUpdate>>(DEFAULT_FORM_DATA);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [isStepValid, setIsStepValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [plan, isOpen]);

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
        handleClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setTimeout(() => {
        setCurrentStep(1);
        setVisitedSteps(new Set([1]));
        setFormData(DEFAULT_FORM_DATA);
      }, 300);
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {plan ? `Editando: ${plan.nome}` : 'Criar Novo Plano'}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {STEPS[currentStep - 1].description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Stepper */}
              <div className="px-6 pt-6">
                <PlanFormStepper
                  steps={STEPS}
                  currentStep={currentStep}
                  visitedSteps={visitedSteps}
                  onStepClick={handleStepClick}
                />
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
                {renderStepContent()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-700/50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-700/50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  )}

                  {currentStep < STEPS.length ? (
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!isStepValid || isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}