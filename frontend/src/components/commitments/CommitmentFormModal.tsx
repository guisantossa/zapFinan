import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Save, AlertCircle } from 'lucide-react';
import {
  Commitment,
  CommitmentCreate,
  CommitmentUpdate,
  CommitmentType,
  CommitmentStatus,
  CommitmentRecurrence,
  COMMITMENT_TYPES,
  COMMITMENT_STATUS,
  RECURRENCE_OPTIONS
} from '../../types/commitment';
import { commitmentApi } from '../../services/commitmentApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface CommitmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment?: Commitment | null;
  onSuccess: () => void;
}

interface FormData {
  titulo: string;
  descricao: string;
  data_inicio: string;
  hora_inicio: string;
  data_fim: string;
  hora_fim: string;
  tipo: CommitmentType;
  status: CommitmentStatus;
  recorrencia: CommitmentRecurrence;
  recorrencia_ate: string;
  lembrete_whatsapp: boolean;
  minutos_antes_lembrete: string;
}

export function CommitmentFormModal({ isOpen, onClose, commitment, onSuccess }: CommitmentFormModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descricao: '',
    data_inicio: '',
    hora_inicio: '',
    data_fim: '',
    hora_fim: '',
    tipo: 'evento',
    status: 'agendado',
    recorrencia: 'nenhuma',
    recorrencia_ate: '',
    lembrete_whatsapp: true,
    minutos_antes_lembrete: '30'
  });

  // Reset form when modal opens/closes or commitment changes
  useEffect(() => {
    if (isOpen) {
      if (commitment) {
        // Editing existing commitment
        const dataInicio = new Date(commitment.data_inicio);
        const dataFim = new Date(commitment.data_fim);

        setFormData({
          titulo: commitment.titulo,
          descricao: commitment.descricao || '',
          data_inicio: dataInicio.toISOString().split('T')[0],
          hora_inicio: dataInicio.toTimeString().slice(0, 5),
          data_fim: dataFim.toISOString().split('T')[0],
          hora_fim: dataFim.toTimeString().slice(0, 5),
          tipo: commitment.tipo,
          status: commitment.status,
          recorrencia: commitment.recorrencia,
          recorrencia_ate: commitment.recorrencia_ate || '',
          lembrete_whatsapp: commitment.lembrete_whatsapp,
          minutos_antes_lembrete: commitment.minutos_antes_lembrete.toString()
        });
      } else {
        // Creating new commitment - set default dates
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        setFormData({
          titulo: '',
          descricao: '',
          data_inicio: now.toISOString().split('T')[0],
          hora_inicio: now.toTimeString().slice(0, 5),
          data_fim: now.toISOString().split('T')[0],
          hora_fim: oneHourLater.toTimeString().slice(0, 5),
          tipo: 'evento',
          status: 'agendado',
          recorrencia: 'nenhuma',
          recorrencia_ate: '',
          lembrete_whatsapp: true,
          minutos_antes_lembrete: '30'
        });
      }
      setErrors({});
    }
  }, [isOpen, commitment]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'Hora de início é obrigatória';
    }

    if (!formData.data_fim) {
      newErrors.data_fim = 'Data de fim é obrigatória';
    }

    if (!formData.hora_fim) {
      newErrors.hora_fim = 'Hora de fim é obrigatória';
    }

    // Validate date/time logic
    if (formData.data_inicio && formData.hora_inicio && formData.data_fim && formData.hora_fim) {
      const dataHoraInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataHoraFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      if (dataHoraFim <= dataHoraInicio) {
        newErrors.data_fim = 'Data/hora de fim deve ser posterior ao início';
      }
    }

    // Validate recurrence end date
    if (formData.recorrencia !== 'nenhuma' && !formData.recorrencia_ate) {
      newErrors.recorrencia_ate = 'Data limite é obrigatória para compromissos recorrentes';
    }

    // Validate reminder minutes
    const minutosAntes = parseInt(formData.minutos_antes_lembrete);
    if (isNaN(minutosAntes) || minutosAntes < 0 || minutosAntes > 1440) {
      newErrors.minutos_antes_lembrete = 'Minutos deve estar entre 0 e 1440';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const dataHoraInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataHoraFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      const commitmentData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        data_inicio: dataHoraInicio.toISOString(),
        data_fim: dataHoraFim.toISOString(),
        tipo: formData.tipo,
        status: formData.status,
        recorrencia: formData.recorrencia,
        recorrencia_ate: formData.recorrencia !== 'nenhuma' ? formData.recorrencia_ate : undefined,
        lembrete_whatsapp: formData.lembrete_whatsapp,
        minutos_antes_lembrete: parseInt(formData.minutos_antes_lembrete)
      };

      if (commitment) {
        // Update existing commitment
        await commitmentApi.updateCommitment(commitment.id, commitmentData as CommitmentUpdate);
        toast.success('Compromisso atualizado com sucesso!');
      } else {
        // Create new commitment
        const createData: CommitmentCreate = {
          ...commitmentData,
          usuario_id: user.id
        };
        await commitmentApi.createCommitment(createData);
        toast.success('Compromisso criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving commitment:', error);
      toast.error(error.message || 'Erro ao salvar compromisso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-set end date when start date changes
  const handleStartDateChange = (newDate: string) => {
    handleInputChange('data_inicio', newDate);

    // If end date is before start date, update it
    if (formData.data_fim < newDate) {
      handleInputChange('data_fim', newDate);
    }
  };

  const getTypeIcon = (type: CommitmentType) => {
    const typeConfig = COMMITMENT_TYPES.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : '📅';
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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
            className="relative w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {commitment ? 'Editar Compromisso' : 'Novo Compromisso'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {commitment ? 'Atualize as informações do compromisso' : 'Preencha os dados para criar um novo compromisso'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="rounded-full bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informações Básicas</h3> {/* Updated */}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <Input
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: Reunião com cliente, Pagamento cartão..."
                className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                  errors.titulo ? 'border-red-500' : ''
                }`}
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.titulo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Detalhes adicionais sobre o compromisso..."
                rows={3}
                className="w-full px-3 py-2 bg-white/70 dark:bg-slate-700/70 border border-gray-200/50 dark:border-gray-600/50 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value as CommitmentType)}
                  className="w-full px-3 py-2 bg-white/70 dark:bg-slate-700/70 border border-gray-200/50 dark:border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMITMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as CommitmentStatus)}
                  className="w-full px-3 py-2 bg-white/70 dark:bg-slate-700/70 border border-gray-200/50 dark:border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMITMENT_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Data e Hora
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Início *
                </label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                    errors.data_inicio ? 'border-red-500' : ''
                  }`}
                />
                {errors.data_inicio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.data_inicio}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Início *
                </label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                  className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                    errors.hora_inicio ? 'border-red-500' : ''
                  }`}
                />
                {errors.hora_inicio && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.hora_inicio}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Fim *
                </label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => handleInputChange('data_fim', e.target.value)}
                  min={formData.data_inicio}
                  className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                    errors.data_fim ? 'border-red-500' : ''
                  }`}
                />
                {errors.data_fim && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.data_fim}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Fim *
                </label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => handleInputChange('hora_fim', e.target.value)}
                  className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                    errors.hora_fim ? 'border-red-500' : ''
                  }`}
                />
                {errors.hora_fim && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.hora_fim}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recorrência</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repetir
                </label>
                <select
                  value={formData.recorrencia}
                  onChange={(e) => handleInputChange('recorrencia', e.target.value as CommitmentRecurrence)}
                  className="w-full px-3 py-2 bg-white/70 dark:bg-slate-700/70 border border-gray-200/50 dark:border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.recorrencia !== 'nenhuma' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repetir até *
                  </label>
                  <Input
                    type="date"
                    value={formData.recorrencia_ate}
                    onChange={(e) => handleInputChange('recorrencia_ate', e.target.value)}
                    min={formData.data_inicio}
                    className={`bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 ${
                      errors.recorrencia_ate ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.recorrencia_ate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.recorrencia_ate}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lembretes</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  id="lembrete_whatsapp"
                  type="checkbox"
                  checked={formData.lembrete_whatsapp}
                  onChange={(e) => handleInputChange('lembrete_whatsapp', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lembrete_whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receber lembrete via WhatsApp
                </label>
              </div>

              {formData.lembrete_whatsapp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lembrar com quantos minutos de antecedência?
                  </label>
                  <select
                    value={formData.minutos_antes_lembrete}
                    onChange={(e) => handleInputChange('minutos_antes_lembrete', e.target.value)}
                    className="w-full md:w-48 px-3 py-2 bg-white/70 dark:bg-slate-700/70 border border-gray-200/50 dark:border-gray-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="5">5 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="1440">1 dia</option>
                  </select>
                  {errors.minutos_antes_lembrete && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.minutos_antes_lembrete}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

                {/* Actions */}
            <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    {commitment ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {commitment ? 'Atualizar' : 'Criar'} Compromisso
                  </>
                )}
              </Button>
            </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}