import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Star, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'savings' | 'debt' | 'expense_reduction' | 'income_increase' | 'investment';
  priority: 'low' | 'medium' | 'high';
  status: 'on_track' | 'behind' | 'ahead' | 'completed' | 'at_risk';
  progressPercentage: number;
  daysRemaining: number;
  monthlyTarget: number;
  monthlyProgress: number;
}

interface GoalInsights {
  totalGoals: number;
  completedGoals: number;
  onTrackGoals: number;
  atRiskGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgress: number;
  recommendedMonthlyContribution: number;
  insights: string[];
}

interface FinancialGoalsWidgetProps {
  className?: string;
  dashboardData?: any;
}

export function FinancialGoalsWidget({ className = '', dashboardData }: FinancialGoalsWidgetProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [insights, setInsights] = useState<GoalInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'insights'>('active');

  useEffect(() => {
    if (user?.id && dashboardData) {
      generateGoalsData();
    }
  }, [user?.id, dashboardData]);

  const generateGoalsData = async () => {
    if (!user?.id || !dashboardData) return;

    try {
      setIsLoading(true);
      setError(null);

      // For now, we'll generate mock goals based on user's financial data
      // In a real app, this would come from a goals API
      const currentBalance = dashboardData.resumo.saldo;
      const monthlyIncome = dashboardData.resumo.total_receitas;
      const monthlyExpenses = dashboardData.resumo.total_despesas;

      const mockGoals: FinancialGoal[] = [
        {
          id: '1',
          title: 'Fundo de Emergência',
          description: 'Acumular 6 meses de gastos em reserva de emergência',
          targetAmount: monthlyExpenses * 6,
          currentAmount: Math.max(currentBalance * 0.3, 0),
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'savings',
          priority: 'high',
          status: 'on_track',
          progressPercentage: 0,
          daysRemaining: 365,
          monthlyTarget: 0,
          monthlyProgress: 0
        },
        {
          id: '2',
          title: 'Reduzir Gastos Variáveis',
          description: 'Diminuir gastos supérfluos em 20%',
          targetAmount: monthlyExpenses * 0.2,
          currentAmount: Math.max(0, monthlyExpenses * 0.05),
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'expense_reduction',
          priority: 'medium',
          status: 'behind',
          progressPercentage: 0,
          daysRemaining: 90,
          monthlyTarget: 0,
          monthlyProgress: 0
        },
        {
          id: '3',
          title: 'Investimento em Educação',
          description: 'Economizar para curso de especialização',
          targetAmount: 5000,
          currentAmount: 1200,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'investment',
          priority: 'medium',
          status: 'on_track',
          progressPercentage: 0,
          daysRemaining: 180,
          monthlyTarget: 0,
          monthlyProgress: 0
        },
        {
          id: '4',
          title: 'Aumentar Renda Extra',
          description: 'Conseguir R$ 1.000 adicais por mês',
          targetAmount: 1000,
          currentAmount: 300,
          targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: 'income_increase',
          priority: 'high',
          status: 'ahead',
          progressPercentage: 0,
          daysRemaining: 120,
          monthlyTarget: 0,
          monthlyProgress: 0
        }
      ];

      // Calculate progress and status for each goal
      const processedGoals = mockGoals.map(goal => {
        const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        const daysRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const monthsRemaining = Math.max(1, daysRemaining / 30);

        const monthlyTarget = Math.max(0, (goal.targetAmount - goal.currentAmount) / monthsRemaining);

        // For savings goals, monthly progress is based on current savings rate
        let monthlyProgress = 0;
        if (goal.category === 'savings') {
          monthlyProgress = Math.max(0, currentBalance * 0.1); // Assume 10% of balance goes to savings
        } else if (goal.category === 'expense_reduction') {
          monthlyProgress = goal.currentAmount;
        } else {
          monthlyProgress = goal.currentAmount * 0.3; // Assume 30% of current amount is monthly progress
        }

        // Determine status
        let status: FinancialGoal['status'] = 'on_track';

        if (progressPercentage >= 100) {
          status = 'completed';
        } else if (daysRemaining <= 30 && progressPercentage < 80) {
          status = 'at_risk';
        } else if (progressPercentage > 120 / monthsRemaining * (12 - monthsRemaining)) {
          status = 'ahead';
        } else if (progressPercentage < 80 / monthsRemaining * (12 - monthsRemaining)) {
          status = 'behind';
        }

        return {
          ...goal,
          progressPercentage: Math.round(progressPercentage),
          daysRemaining,
          monthlyTarget: Math.round(monthlyTarget),
          monthlyProgress: Math.round(monthlyProgress),
          status
        };
      });

      setGoals(processedGoals);

      // Calculate insights
      const totalGoals = processedGoals.length;
      const completedGoals = processedGoals.filter(g => g.status === 'completed').length;
      const onTrackGoals = processedGoals.filter(g => g.status === 'on_track' || g.status === 'ahead').length;
      const atRiskGoals = processedGoals.filter(g => g.status === 'at_risk' || g.status === 'behind').length;

      const totalTargetAmount = processedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const totalCurrentAmount = processedGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const averageProgress = processedGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / totalGoals;

      const recommendedMonthlyContribution = processedGoals
        .filter(g => g.status !== 'completed')
        .reduce((sum, goal) => sum + goal.monthlyTarget, 0);

      // Generate insights
      const insightMessages: string[] = [];

      if (completedGoals > 0) {
        insightMessages.push(`🎉 Parabéns! ${completedGoals} meta${completedGoals > 1 ? 's' : ''} alcançada${completedGoals > 1 ? 's' : ''}`);
      }

      if (atRiskGoals > 0) {
        insightMessages.push(`⚠️ ${atRiskGoals} meta${atRiskGoals > 1 ? 's' : ''} em risco - ajuste necessário`);
      }

      if (averageProgress > 75) {
        insightMessages.push(`📈 Excelente progresso! Média de ${averageProgress.toFixed(0)}%`);
      } else if (averageProgress < 25) {
        insightMessages.push(`🎯 Foque nas metas prioritárias para acelerar o progresso`);
      }

      if (recommendedMonthlyContribution > monthlyIncome * 0.5) {
        insightMessages.push(`💡 Revise suas metas - contribuição muito alta para a renda`);
      }

      if (insightMessages.length === 0) {
        insightMessages.push('📊 Continue focado em suas metas financeiras');
      }

      setInsights({
        totalGoals,
        completedGoals,
        onTrackGoals,
        atRiskGoals,
        totalTargetAmount,
        totalCurrentAmount,
        averageProgress: Math.round(averageProgress),
        recommendedMonthlyContribution,
        insights: insightMessages
      });

    } catch (err: any) {
      console.error('Error generating goals data:', err);
      setError(err.message || 'Erro ao carregar metas');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: FinancialGoal['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
      case 'ahead': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300';
      case 'on_track': return 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300';
      case 'behind': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'at_risk': return 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: FinancialGoal['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'ahead': return TrendingUp;
      case 'on_track': return Target;
      case 'behind': return Clock;
      case 'at_risk': return AlertTriangle;
      default: return Target;
    }
  };

  const getPriorityColor = (priority: FinancialGoal['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 dark:border-red-800';
      case 'medium': return 'border-yellow-200 dark:border-yellow-800';
      case 'low': return 'border-green-200 dark:border-green-800';
      default: return 'border-gray-200 dark:border-gray-800';
    }
  };

  const getCategoryIcon = (category: FinancialGoal['category']) => {
    switch (category) {
      case 'savings': return '💰';
      case 'debt': return '💳';
      case 'expense_reduction': return '✂️';
      case 'income_increase': return '📈';
      case 'investment': return '📊';
      default: return '🎯';
    }
  };

  const formatCurrency = (value: number) => {
    return dashboardApi.formatCurrency(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
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
          <Target className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Erro ao carregar metas</p>
          <Button variant="outline" size="sm" onClick={generateGoalsData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

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
            Metas Financeiras
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full border border-yellow-200 dark:border-yellow-700">
              📋 Simulação
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dados de exemplo baseados no seu perfil
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('active')}
            className="text-xs"
          >
            Ativas ({activeGoals.length})
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('completed')}
            className="text-xs"
          >
            Concluídas ({completedGoals.length})
          </Button>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('insights')}
            className="text-xs"
          >
            Insights
          </Button>
        </div>
      </div>

      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Nenhuma meta ativa encontrada
              </p>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar Meta
              </Button>
            </div>
          ) : (
            activeGoals.map((goal, index) => {
              const StatusIcon = getStatusIcon(goal.status);

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border-l-4 ${getPriorityColor(goal.priority)} bg-gray-50/50 dark:bg-slate-700/50`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getCategoryIcon(goal.category)}</span>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {goal.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                        {goal.status === 'completed' ? 'Concluída' :
                         goal.status === 'ahead' ? 'Adiantada' :
                         goal.status === 'on_track' ? 'No prazo' :
                         goal.status === 'behind' ? 'Atrasada' : 'Em risco'}
                      </span>
                      <StatusIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progresso: {goal.progressPercentage}%</span>
                        <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                          className={`h-full rounded-full ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'ahead' ? 'bg-blue-500' :
                            goal.status === 'on_track' ? 'bg-green-500' :
                            goal.status === 'behind' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Goal details */}
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Meta mensal</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {formatCurrency(goal.monthlyTarget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Progresso mensal</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {formatCurrency(goal.monthlyProgress)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Prazo</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {goal.daysRemaining} dias
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedGoals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhuma meta concluída ainda
              </p>
            </div>
          ) : (
            completedGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-4 rounded-2xl bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {goal.title}
                      </h4>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Meta alcançada: {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {formatDate(goal.targetDate)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'insights' && insights && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl">
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">
                Progresso Geral
              </h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {insights.averageProgress}%
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {insights.onTrackGoals} de {insights.totalGoals} no prazo
              </p>
            </div>

            <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-2xl">
              <h4 className="text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                Contribuição Mensal
              </h4>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(insights.recommendedMonthlyContribution)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Recomendado para atingir metas
              </p>
            </div>
          </div>

          {/* Insights */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              Insights Personalizados
            </h4>
            <div className="space-y-2">
              {insights.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl"
                >
                  <p className="text-sm text-purple-700 dark:text-purple-300">{insight}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}