import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlanResponse } from '../../services/plansApi';
import { plansApi } from '../../services/plansApi';
import {
  Edit,
  Eye,
  EyeOff,
  Star,
  Trash2,
} from 'lucide-react';

interface PlanAdminRowProps {
  plan: PlanResponse;
  index: number;
  onEdit: (plan: PlanResponse) => void;
  onActivate: (planId: number) => void;
  onDeactivate: (planId: number) => void;
  onSetDefault: (planId: number) => void;
  onDelete: (planId: number) => void;
}

export function PlanAdminRow({
  plan,
  onEdit,
  onActivate,
  onDeactivate,
  onSetDefault,
  onDelete,
}: PlanAdminRowProps) {

  const featuresCount = [
    plan.transactions_enabled,
    plan.budgets_enabled,
    plan.commitments_enabled,
    plan.reports_advanced,
    plan.google_calendar_sync,
    plan.api_access,
    plan.priority_support,
  ].filter(Boolean).length;

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !plan.is_active ? 'opacity-50' : ''
      }`}
    >
      {/* Name */}
      <td className="py-4 px-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {plan.nome}
            </p>
            {plan.is_default && (
              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Padrão
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
            {plan.description || 'Sem descrição'}
          </p>
        </div>
      </td>

      {/* Price */}
      <td className="py-4 px-6 text-right">
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {plansApi.formatCurrency(plan.valor_mensal)}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/mês</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {plansApi.formatCurrency(plan.valor_anual)}/ano
        </div>
      </td>

      {/* Features */}
      <td className="py-4 px-6 text-center">
        <div className="inline-flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {featuresCount}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/ 7</span>
        </div>
      </td>

      {/* Limits */}
      <td className="py-4 px-6">
        <div className="text-xs space-y-0.5">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {plansApi.getLimitDisplay(plan.max_transactions_per_month)}
            </span> transações
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {plansApi.getLimitDisplay(plan.max_budgets)}
            </span> orçamentos
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-6">
        {plan.is_active ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 px-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(plan)}
            className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
            title="Editar plano"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {plan.is_active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeactivate(plan.id)}
              className="h-9 w-9 p-0 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-400"
              title="Desativar plano"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onActivate(plan.id)}
              className="h-9 w-9 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
              title="Ativar plano"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {!plan.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetDefault(plan.id)}
              className="h-9 w-9 p-0 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950 dark:hover:text-yellow-400"
              title="Definir como padrão"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(plan.id)}
            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            title="Excluir plano"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}