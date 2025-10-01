import { useEffect } from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { StepProps } from './types';

const colorOptions = [
  { value: 'blue', bg: '#3b82f6', name: 'Azul' },
  { value: 'green', bg: '#22c55e', name: 'Verde' },
  { value: 'purple', bg: '#a855f7', name: 'Roxo' },
  { value: 'orange', bg: '#f97316', name: 'Laranja' },
  { value: 'pink', bg: '#ec4899', name: 'Rosa' },
  { value: 'indigo', bg: '#6366f1', name: 'Índigo' },
];

export function Step5_ConfigAppearance({ formData, updateFormData, setIsValid }: StepProps) {
  useEffect(() => {
    // Este passo não tem validação obrigatória, sempre é válido
    setIsValid(true);
  }, [setIsValid, formData]);

  return (
    <div className="space-y-8">
      {/* Visibilidade */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Visibilidade e Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start justify-between p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200">
            <div className="flex-1">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Plano Ativo
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visível para usuários na página de planos
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                type="button"
                onClick={() => updateFormData({ is_active: false })}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: !(formData.is_active ?? true) ? '#ef4444' : '#d1d5db',
                  color: !(formData.is_active ?? true) ? '#ffffff' : '#6b7280',
                  cursor: 'pointer',
                  opacity: !(formData.is_active ?? true) ? 1 : 0.7,
                }}
              >
                Inativo
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ is_active: true })}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: (formData.is_active ?? true) ? '#22c55e' : '#d1d5db',
                  color: (formData.is_active ?? true) ? '#ffffff' : '#6b7280',
                  cursor: 'pointer',
                  opacity: (formData.is_active ?? true) ? 1 : 0.7,
                }}
              >
                Ativo
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200">
            <div className="flex-1">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                Plano Padrão
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Atribuído automaticamente a novos usuários
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                type="button"
                onClick={() => updateFormData({ is_default: false })}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: !(formData.is_default ?? false) ? '#ef4444' : '#d1d5db',
                  color: !(formData.is_default ?? false) ? '#ffffff' : '#6b7280',
                  cursor: 'pointer',
                  opacity: !(formData.is_default ?? false) ? 1 : 0.7,
                }}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ is_default: true })}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  backgroundColor: (formData.is_default ?? false) ? '#22c55e' : '#d1d5db',
                  color: (formData.is_default ?? false) ? '#ffffff' : '#6b7280',
                  cursor: 'pointer',
                  opacity: (formData.is_default ?? false) ? 1 : 0.7,
                }}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aparência */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Aparência
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
              Cor do Tema
            </Label>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => updateFormData({ color: color.value })}
                  style={{
                    backgroundColor: color.bg,
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '9999px',
                    border: formData.color === color.value ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: formData.color === color.value ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: formData.color === color.value ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : 'none',
                  }}
                  aria-label={`Selecionar cor ${color.name}`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="displayOrder" className="text-base font-medium text-gray-900 dark:text-gray-100">
              Ordem de Exibição
            </Label>
            <Input
              id="displayOrder"
              type="number"
              min="0"
              value={formData.display_order ?? 0}
              onChange={(e) => updateFormData({ display_order: parseInt(e.target.value) || 0 })}
              className="mt-2 h-10 text-base"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Menor valor = aparece primeiro
            </p>
          </div>
        </div>
      </div>

      {/* Features JSON (Opcional) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Configurações Avançadas (Opcional)
        </h3>
        <div>
          <Label htmlFor="featuresJson" className="text-base font-medium text-gray-900 dark:text-gray-100">
            Features JSON
          </Label>
          <Textarea
            id="featuresJson"
            value={formData.features_json ? JSON.stringify(formData.features_json, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                updateFormData({ features_json: parsed });
              } catch {
                // Invalid JSON, ignore
              }
            }}
            placeholder='{"custom_feature": true}'
            rows={4}
            className="mt-2 text-sm font-mono"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            JSON com features personalizadas adicionais (formato: {`{"key": "value"}`})
          </p>
        </div>
      </div>
    </div>
  );
}