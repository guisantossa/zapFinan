import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, TrendingUp, TrendingDown, CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, TransactionCreate, TransactionUpdate } from '../../types/transaction';
import { useCategories } from '../../hooks/useCategories';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  descricao: string;
  valor: string;
  tipo: 'despesa' | 'receita';
  categoria_id: string;
  data_transacao: Date;
  mensagem_original: string;
}

interface FormErrors {
  descricao?: string;
  valor?: string;
  categoria_id?: string;
  data_transacao?: string;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  transaction,
  onSubmit,
  isLoading = false
}: TransactionFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    categoria_id: '0',
    data_transacao: new Date(),
    mensagem_original: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Get categories based on transaction type
  const { categories, loading: categoriesLoading } = useCategories(formData.tipo);

  // Reset form when modal opens/closes or transaction changes
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Editing existing transaction
        setFormData({
          descricao: transaction.descricao || '',
          valor: transaction.valor.toString(),
          tipo: transaction.tipo,
          categoria_id: transaction.categoria?.id?.toString() || '0',
          data_transacao: new Date(transaction.data_transacao),
          mensagem_original: transaction.mensagem_original || '',
        });
      } else {
        // Creating new transaction
        setFormData({
          descricao: '',
          valor: '',
          tipo: 'despesa',
          categoria_id: '0',
          data_transacao: new Date(),
          mensagem_original: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.data_transacao) {
      newErrors.data_transacao = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      descricao: formData.descricao.trim(),
      valor: parseFloat(formData.valor),
      tipo: formData.tipo,
      categoria_id: formData.categoria_id && formData.categoria_id !== "0" ? parseInt(formData.categoria_id) : undefined,
      data_transacao: formData.data_transacao.toISOString().split('T')[0],
      mensagem_original: formData.mensagem_original || formData.descricao,
      canal: 'webApp',
    };

    await onSubmit(submitData);
  };

  const handleValueChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setFormData(prev => ({ ...prev, valor: cleanValue }));

    // Clear error when user starts typing
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: undefined }));
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const isIncome = formData.tipo === 'receita';

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
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    isIncome
                      ? "bg-gradient-to-br from-green-500 to-emerald-600"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  )}>
                    {isIncome ? (
                      <TrendingUp className="w-5 h-5 text-white" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {transaction ? 'Editar Transação' : 'Nova Transação'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction ? 'Atualize as informações da transação' : `Registre uma nova ${isIncome ? 'receita' : 'despesa'}`}
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

              {/* Form - Scrollable Container */}
              <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-6">
                <form onSubmit={handleSubmit} className="py-6 space-y-6">
                  {/* Type Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="tipo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo *
                    </Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: 'despesa' | 'receita') =>
                        setFormData(prev => ({ ...prev, tipo: value }))
                      }
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
                        <SelectItem value="despesa">💸 Despesa</SelectItem>
                        <SelectItem value="receita">💰 Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label htmlFor="descricao" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descrição *
                    </Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, descricao: e.target.value }));
                        if (errors.descricao) {
                          setErrors(prev => ({ ...prev, descricao: undefined }));
                        }
                      }}
                      placeholder="Ex: Almoço no restaurante, Salário..."
                      className={`rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11 px-4 ${
                        errors.descricao ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.descricao}
                      </p>
                    )}
                  </div>

                  {/* Value */}
                  <div className="space-y-3">
                    <Label htmlFor="valor" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Valor *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                        R$
                      </span>
                      <Input
                        id="valor"
                        value={formData.valor}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder="0,00"
                        className={`rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11 pl-12 pr-20 ${
                          errors.valor ? 'border-red-500' : ''
                        }`}
                      />
                      {formData.valor && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600 dark:text-gray-400">
                          {formatCurrency(formData.valor)}
                        </div>
                      )}
                    </div>
                    {errors.valor && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.valor}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data da Transação *
                    </Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11 px-4",
                            !formData.data_transacao && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.data_transacao ? (
                            format(formData.data_transacao, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.data_transacao}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({ ...prev, data_transacao: date }));
                              setIsDatePickerOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <Label htmlFor="categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Categoria
                    </Label>
                    <Select
                      value={formData.categoria_id}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, categoria_id: value }))
                      }
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11">
                        <SelectValue placeholder={categoriesLoading ? "Carregando categorias..." : "Selecione uma categoria"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
                        <SelectItem value="0">Sem categoria</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Original Message (optional - only show if different from description) */}
                  {transaction?.mensagem_original !== transaction?.descricao && (
                    <div className="space-y-3">
                      <Label htmlFor="mensagem_original" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mensagem Original
                      </Label>
                      <Textarea
                        id="mensagem_original"
                        value={formData.mensagem_original}
                        onChange={(e) => setFormData(prev => ({ ...prev, mensagem_original: e.target.value }))}
                        placeholder="Mensagem original (se diferente da descrição)"
                        rows={3}
                        className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 px-4 py-3"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.descricao || !formData.valor}
                      className={cn(
                        "shadow-lg font-semibold",
                        isIncome
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          {transaction ? 'Atualizando...' : 'Criando...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {transaction ? 'Atualizar' : 'Criar'} Transação
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
