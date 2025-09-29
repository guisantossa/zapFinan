import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Plus, Bell } from 'lucide-react';
import { commitmentApi } from '../../services/commitmentApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Commitment } from '../../types/commitment';
import { COMMITMENT_TYPES } from '../../types/commitment';

interface UpcomingCommitment {
  id: string;
  titulo: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  dias_restantes: number;
  urgency: 'urgent' | 'soon' | 'normal';
}

interface UpcomingCommitmentsWidgetProps {
  className?: string;
}

export function UpcomingCommitmentsWidget({ className = '' }: UpcomingCommitmentsWidgetProps) {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<UpcomingCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUpcomingCommitments();
    }
  }, [user?.id]);

  const loadUpcomingCommitments = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get all commitments and filter for upcoming ones
      const allCommitments = await commitmentApi.getCommitments(user.id);

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcomingCommitments = allCommitments
        .filter((commitment: Commitment) => {
          const startDate = new Date(commitment.data_inicio);
          return startDate >= now && startDate <= nextWeek && commitment.status === 'agendado';
        })
        .map((commitment: Commitment) => {
          const startDate = new Date(commitment.data_inicio);
          const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let urgency: 'urgent' | 'soon' | 'normal' = 'normal';
          if (daysUntil <= 1) urgency = 'urgent';
          else if (daysUntil <= 3) urgency = 'soon';

          return {
            id: commitment.id,
            titulo: commitment.titulo,
            tipo: commitment.tipo,
            data_inicio: commitment.data_inicio,
            data_fim: commitment.data_fim,
            status: commitment.status,
            dias_restantes: daysUntil,
            urgency
          };
        })
        .sort((a, b) => a.dias_restantes - b.dias_restantes)
        .slice(0, 5); // Limit to 5 most urgent

      setCommitments(upcomingCommitments);

    } catch (err: any) {
      console.error('Error loading upcoming commitments:', err);
      setError(err.message || 'Erro ao carregar compromissos');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeInfo = (type: string) => {
    const typeConfig = COMMITMENT_TYPES.find(t => t.value === type);
    return typeConfig || { icon: '📅', label: 'Compromisso', color: 'blue' };
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'from-red-500 to-red-600';
      case 'soon': return 'from-yellow-500 to-orange-500';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'soon': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDaysText = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `${days} dias`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-36 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-20 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400">Erro ao carregar compromissos</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUpcomingCommitments}
            className="mt-3"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (commitments.length === 0) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tudo em Dia!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Nenhum compromisso nos próximos 7 dias
          </p>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Compromisso
          </Button>
        </div>
      </div>
    );
  }

  const urgentCount = commitments.filter(c => c.urgency === 'urgent').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Próximos Compromissos
          </h3>
          {urgentCount > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className={`p-2 bg-gradient-to-br ${urgentCount > 0 ? 'from-red-500 to-red-600' : 'from-blue-500 to-indigo-600'} rounded-xl relative`}>
          <Calendar className="w-5 h-5 text-white" />
          {urgentCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {commitments.map((commitment, index) => {
          const typeInfo = getTypeInfo(commitment.tipo);

          return (
            <motion.div
              key={commitment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`flex items-center space-x-3 p-3 rounded-2xl transition-all duration-200 ${
                commitment.urgency === 'urgent' ? 'bg-red-50 dark:bg-red-900/20' :
                commitment.urgency === 'soon' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                'bg-gray-50 dark:bg-slate-700/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getUrgencyColor(commitment.urgency)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm">{typeInfo.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {commitment.titulo}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDate(commitment.data_inicio)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-1">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${getUrgencyBg(commitment.urgency)}`}>
                  {getDaysText(commitment.dias_restantes)}
                </span>
                {commitment.urgency === 'urgent' && (
                  <Bell className="w-3 h-3 text-red-500 animate-pulse" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Próximos 7 dias</span>
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{commitments.length} compromisso{commitments.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}