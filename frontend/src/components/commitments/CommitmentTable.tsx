import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PauseCircle,
  ArrowRight
} from 'lucide-react';
import {
  Commitment,
  CommitmentType,
  CommitmentStatus,
  COMMITMENT_TYPES,
  COMMITMENT_STATUS
} from '../../types/commitment';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { commitmentApi } from '../../services/commitmentApi';

interface CommitmentTableProps {
  commitments: Commitment[];
  isLoading?: boolean;
  onEditCommitment: (commitment: Commitment) => void;
  onDeleteCommitment: (commitment: Commitment) => void;
  onViewCommitment?: (commitment: Commitment) => void;
  onMarkCompleted?: (commitment: Commitment) => void;
  onMarkCancelled?: (commitment: Commitment) => void;
}

interface StatusBadgeProps {
  status: CommitmentStatus;
  isOverdue?: boolean;
}

function StatusBadge({ status, isOverdue }: StatusBadgeProps) {
  const getStatusConfig = (status: CommitmentStatus, overdue: boolean) => {
    if (overdue && status === 'agendado') {
      return {
        text: 'Vencido',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: AlertTriangle
      };
    }

    const statusConfig = {
      agendado: {
        text: 'Agendado',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        icon: Clock
      },
      concluido: {
        text: 'Concluído',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
        icon: CheckCircle
      },
      cancelado: {
        text: 'Cancelado',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
        icon: XCircle
      },
      adiado: {
        text: 'Adiado',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        icon: PauseCircle
      }
    };

    return statusConfig[status];
  };

  const config = getStatusConfig(status, isOverdue || false);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {config.text}
    </span>
  );
}

interface TypeBadgeProps {
  type: CommitmentType;
}

function TypeBadge({ type }: TypeBadgeProps) {
  const typeConfig = COMMITMENT_TYPES.find(t => t.value === type);

  if (!typeConfig) return null;

  const colorClass = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    pink: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800'
  }[typeConfig.color];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}>
      <span className="mr-1">{typeConfig.icon}</span>
      {typeConfig.label}
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommitmentTable({
  commitments,
  isLoading,
  onEditCommitment,
  onDeleteCommitment,
  onViewCommitment,
  onMarkCompleted,
  onMarkCancelled
}: CommitmentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setIsTypeDropdownOpen(false);
      setIsStatusDropdownOpen(false);
    };

    if (openDropdownId || isTypeDropdownOpen || isStatusDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId, isTypeDropdownOpen, isStatusDropdownOpen]);

  const filteredCommitments = commitments.filter(commitment => {
    const matchesSearch = commitment.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commitment.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || commitment.tipo === typeFilter;

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'overdue' && commitmentApi.isOverdue(commitment)) ||
                         (statusFilter === 'today' && commitmentApi.isToday(commitment)) ||
                         commitment.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDateRange = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const sameDay = inicio.toDateString() === fim.toDateString();

    if (sameDay) {
      return `${commitmentApi.formatDate(dataInicio)} • ${commitmentApi.formatTime(dataInicio)} - ${commitmentApi.formatTime(dataFim)}`;
    } else {
      return `${commitmentApi.formatDateTime(dataInicio)} - ${commitmentApi.formatDateTime(dataFim)}`;
    }
  };

  const getDaysUntilText = (commitment: Commitment) => {
    const days = commitmentApi.getDaysUntil(commitment);

    if (commitmentApi.isToday(commitment)) {
      return 'Hoje';
    } else if (days === 1) {
      return 'Amanhã';
    } else if (days > 0) {
      return `Em ${days} dias`;
    } else if (days === 0) {
      return 'Hoje';
    } else {
      return `${Math.abs(days)} dias atrás`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar compromissos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Button
            variant="outline"
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsTypeDropdownOpen(!isTypeDropdownOpen);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Tipo
          </Button>

          {isTypeDropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50 rounded-md py-1">
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setIsTypeDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Todos os tipos
              </button>
              {COMMITMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setTypeFilter(type.value);
                    setIsTypeDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Button
            variant="outline"
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Status
          </Button>

          {isStatusDropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50 rounded-md py-1">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Todos
              </button>
              <button
                onClick={() => {
                  setStatusFilter('today');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Hoje
              </button>
              <button
                onClick={() => {
                  setStatusFilter('overdue');
                  setIsStatusDropdownOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Vencidos
              </button>
              {COMMITMENT_STATUS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setStatusFilter(status.value);
                    setIsStatusDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : filteredCommitments.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'Nenhum compromisso encontrado' : 'Nenhum compromisso cadastrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente ajustar os filtros para encontrar o que procura'
                : 'Comece criando seu primeiro compromisso para organizar sua agenda'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Compromisso
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Data/Hora
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Tipo
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Prazo
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredCommitments.map((commitment, index) => (
                    <motion.tr
                      key={commitment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {commitment.titulo}
                            </p>
                            {commitment.descricao && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {commitment.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {formatDateRange(commitment.data_inicio, commitment.data_fim)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <TypeBadge type={commitment.tipo} />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge
                          status={commitment.status}
                          isOverdue={commitmentApi.isOverdue(commitment)}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            commitmentApi.isOverdue(commitment) && commitment.status === 'agendado'
                              ? 'text-red-600 dark:text-red-400'
                              : commitmentApi.isToday(commitment)
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {getDaysUntilText(commitment)}
                          </span>
                          {commitmentApi.isOverdue(commitment) && commitment.status === 'agendado' && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === commitment.id ? null : commitment.id);
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>

                          {openDropdownId === commitment.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50 rounded-md py-1">
                              {onViewCommitment && (
                                <button
                                  onClick={() => {
                                    onViewCommitment(commitment);
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
                                  onEditCommitment(commitment);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </button>

                              {commitment.status === 'agendado' && onMarkCompleted && (
                                <button
                                  onClick={() => {
                                    onMarkCompleted(commitment);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Concluído
                                </button>
                              )}

                              {commitment.status === 'agendado' && onMarkCancelled && (
                                <button
                                  onClick={() => {
                                    onMarkCancelled(commitment);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  onDeleteCommitment(commitment);
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
      {!isLoading && filteredCommitments.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredCommitments.length} de {commitments.length} compromissos
        </div>
      )}
    </motion.div>
  );
}