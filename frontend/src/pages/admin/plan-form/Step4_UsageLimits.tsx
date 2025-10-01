import { useEffect } from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { StepProps } from './types';

interface LimitInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  description: string;
  min?: number;
}

function LimitInput({ label, value, onChange, description, min = 1 }: LimitInputProps) {
  const isUnlimited = value === null;

  return (
    <div className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-medium text-gray-900 dark:text-gray-100">{label}</Label>
        <div className="flex items-center gap-2">
          <Label htmlFor={`unlimited-${label}`} className="text-xs text-gray-600 dark:text-gray-400">
            Ilimitado
          </Label>
          <Switch
            id={`unlimited-${label}`}
            checked={isUnlimited}
            onCheckedChange={(checked) => onChange(checked ? null : min)}
          />
        </div>
      </div>
      {!isUnlimited && (
        <Input
          type="number"
          value={value ?? min}
          onChange={(e) => onChange(parseInt(e.target.value) || min)}
          min={min}
          className="h-11 text-base mb-3"
        />
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function Step4_UsageLimits({ formData, updateFormData, setIsValid }: StepProps) {
  useEffect(() => {
    const isValid = (formData.data_retention_months ?? 0) > 0;
    setIsValid(isValid);
  }, [formData.data_retention_months, setIsValid]);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Limites de Uso
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure os limites de uso para este plano (marque ilimitado para sem restrições)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LimitInput
          label="Transações por Mês"
          value={formData.max_transactions_per_month}
          onChange={(v) => updateFormData({ max_transactions_per_month: v })}
          description="Número máximo de transações que podem ser criadas por mês"
        />

        <LimitInput
          label="Orçamentos"
          value={formData.max_budgets}
          onChange={(v) => updateFormData({ max_budgets: v })}
          description="Número máximo de orçamentos simultâneos"
        />

        <LimitInput
          label="Compromissos"
          value={formData.max_commitments}
          onChange={(v) => updateFormData({ max_commitments: v })}
          description="Número máximo de compromissos simultâneos"
        />

        <LimitInput
          label="Categorias"
          value={formData.max_categories}
          onChange={(v) => updateFormData({ max_categories: v })}
          description="Número máximo de categorias personalizadas"
        />

        <LimitInput
          label="Telefones"
          value={formData.max_phones}
          onChange={(v) => updateFormData({ max_phones: v })}
          description="Número máximo de telefones cadastrados"
        />

        <div className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Label htmlFor="dataRetentionMonths" className="text-base font-medium text-gray-900 dark:text-gray-100">
            Retenção de Dados (meses) *
          </Label>
          <Input
            id="dataRetentionMonths"
            type="number"
            min="1"
            value={formData.data_retention_months ?? 12}
            onChange={(e) => updateFormData({ data_retention_months: parseInt(e.target.value) || 1 })}
            className="h-11 text-base mt-3 mb-3"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Por quanto tempo os dados históricos ficam disponíveis
          </p>
        </div>
      </div>
    </div>
  );
}