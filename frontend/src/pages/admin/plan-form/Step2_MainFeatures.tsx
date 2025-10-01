import { useEffect } from 'react';
import { Label } from '../../../components/ui/label';
import { cn } from '../../../components/ui/utils';
import { StepProps } from './types';

const mainFeatures = [
  { id: 'transactions_enabled', label: 'Transações', desc: 'Permitir registro de transações financeiras' },
  { id: 'budgets_enabled', label: 'Orçamentos', desc: 'Criar e gerenciar orçamentos mensais' },
  { id: 'commitments_enabled', label: 'Compromissos', desc: 'Gerenciar compromissos financeiros recorrentes' },
  { id: 'reports_advanced', label: 'Relatórios Avançados', desc: 'Acesso a relatórios detalhados e análises' },
];

export function Step2_MainFeatures({ formData, updateFormData, setIsValid }: StepProps) {
  useEffect(() => {
    // Este passo não tem validação obrigatória, sempre é válido
    setIsValid(true);
  }, [setIsValid, formData]);

  const handleToggle = (id: string, checked: boolean) => {
    updateFormData({ [id]: checked });
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recursos Principais
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Selecione os recursos básicos que este plano oferece
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mainFeatures.map((feature) => {
          const value = formData[feature.id as keyof typeof formData];
          const isActive = value === true;
          return (
            <div
              key={feature.id}
              className="flex items-start justify-between p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200"
            >
              <div className="flex-1">
                <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {feature.label}
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.desc}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle(feature.id, false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    backgroundColor: !isActive ? '#ef4444' : '#d1d5db',
                    color: !isActive ? '#ffffff' : '#6b7280',
                    cursor: 'pointer',
                    opacity: !isActive ? 1 : 0.7,
                  }}
                >
                  Inativo
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(feature.id, true)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? '#22c55e' : '#d1d5db',
                    color: isActive ? '#ffffff' : '#6b7280',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  Ativo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}