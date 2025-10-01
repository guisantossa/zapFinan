import { useEffect } from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { StepProps } from './types';

export function Step1_BasicInfo({ formData, updateFormData, setIsValid }: StepProps) {
  const { nome, description, valor_mensal, valor_anual } = formData;

  useEffect(() => {
    const isValid = !!nome && (valor_mensal ?? 0) > 0 && (valor_anual ?? 0) > 0;
    setIsValid(isValid);
  }, [nome, valor_mensal, valor_anual, setIsValid]);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="nome" className="text-base font-medium text-gray-900 dark:text-gray-100">
          Nome do Plano *
        </Label>
        <Input
          id="nome"
          value={nome || ''}
          onChange={(e) => updateFormData({ nome: e.target.value })}
          placeholder="Ex: Básico, Pro, Enterprise"
          className="mt-2 h-12 text-base"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-base font-medium text-gray-900 dark:text-gray-100">
          Descrição
        </Label>
        <Textarea
          id="description"
          value={description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Breve descrição do plano e seus benefícios"
          rows={4}
          className="mt-2 text-base"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="valorMensal" className="text-base font-medium text-gray-900 dark:text-gray-100">
            Valor Mensal (R$) *
          </Label>
          <Input
            id="valorMensal"
            type="number"
            step="0.01"
            min="0"
            value={valor_mensal ?? ''}
            onChange={(e) => updateFormData({ valor_mensal: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="mt-2 h-12 text-base"
          />
        </div>

        <div>
          <Label htmlFor="valorAnual" className="text-base font-medium text-gray-900 dark:text-gray-100">
            Valor Anual (R$) *
          </Label>
          <Input
            id="valorAnual"
            type="number"
            step="0.01"
            min="0"
            value={valor_anual ?? ''}
            onChange={(e) => updateFormData({ valor_anual: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="mt-2 h-12 text-base"
          />
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        * Campos obrigatórios
      </p>
    </div>
  );
}