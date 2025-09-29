import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreHorizontal,
  PiggyBank,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Budget } from '../../types/budget';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface BudgetTableProps {
  budgets: Budget[];
  isLoading?: boolean;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (budget: Budget) => void;
  onViewBudget?: (budget: Budget) => void;
}

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  const getColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBackgroundColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-100 dark:bg-red-900/20';
    if (percent >= 80) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  const percent = Number(percentage) || 0;
  const width = Math.max(0, Math.min(percent, 100));

  return (
    <div className={`w-full h-2 rounded-full ${getBackgroundColor(width)} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${getColor(width)}`}
        style={{
          width: `${width}%`,
          backgroundColor: width >= 100 ? '#ef4444' : width >= 80 ? '#eab308' : '#22c55e'
        }}
      />
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  percentage: number;
}

function StatusBadge({ status, percentage }: StatusBadgeProps) {
  const getStatusConfig = (status: string, percentage: number) => {
    if (percentage >= 100) {
      return {
        text: 'Excedido',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
      };
    }

    if (percentage >= 80) {
      return {
        text: 'Próximo ao Limite',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      };
    }

    if (status === 'ativo') {
      return {
        text: 'Ativo',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
      };
    }

    return {
      text: status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
  };

  const config = getStatusConfig(status, percentage);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.text}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BudgetTable({
  budgets,
  isLoading,
  onEditBudget,
  onDeleteBudget,
  onViewBudget
}: BudgetTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setOpenDropdownId(null);
      setIsFilterDropdownOpen(false);
    };

    if (openDropdownId || isFilterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId, isFilterDropdownOpen]);

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.categoria_nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && budget.ativo && budget.status === 'ativo') ||
                         (statusFilter === 'near_limit' && budget.percentual_gasto >= 80 && budget.percentual_gasto < 100) ||
                         (statusFilter === 'exceeded' && budget.percentual_gasto >= 100);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPeriodicityLabel = (periodicidade: string) => {
    const labels = {
      'mensal': 'Mensal',
      'quinzenal': 'Quinzenal',
      'semanal': 'Semanal'
    };
    return labels[periodicidade as keyof typeof labels] || periodicidade;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar orçamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsFilterDropdownOpen(!isFilterDropdownOpen);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Status
          </Button>

          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50 rounded-md py-1">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setIsFilterDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Todos
              </button>
              <button
                onClick={() => {
                  setStatusFilter('active');
                  setIsFilterDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Ativos
              </button>
              <button
                onClick={() => {
                  setStatusFilter('near_limit');
                  setIsFilterDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Próximos ao Limite
              </button>
              <button
                onClick={() => {
                  setStatusFilter('exceeded');
                  setIsFilterDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Excedidos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mt-6">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar o que procura'
                : 'Comece criando seu primeiro orçamento para controlar seus gastos'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Orçamento
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Progresso
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Valores
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Periodicidade
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredBudgets.map((budget, index) => (
                    <motion.tr
                      key={budget.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {budget.nome}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {budget.categoria_nome || 'Categoria não informada'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {Math.round(budget.percentual_gasto)}%
                            </span>
                            {budget.percentual_gasto >= 80 && budget.percentual_gasto < 100 && (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            )}
                            {budget.percentual_gasto >= 100 && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <ProgressBar percentage={budget.percentual_gasto} />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(budget.valor_gasto)} / {formatCurrency(budget.valor_limite)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Disponível: {formatCurrency(budget.valor_limite - budget.valor_gasto)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={budget.status} percentage={budget.percentual_gasto} />
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {getPeriodicityLabel(budget.periodicidade)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === budget.id ? null : budget.id);
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>

                          {openDropdownId === budget.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50 rounded-md py-1">
                              {onViewBudget && (
                                <button
                                  onClick={() => {
                                    onViewBudget(budget);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Visualizar
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  onEditBudget(budget);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteBudget(budget);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!isLoading && filteredBudgets.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredBudgets.length} de {budgets.length} orçamentos
        </div>
      )}
    </motion.div>
  );
}