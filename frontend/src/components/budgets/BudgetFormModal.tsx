import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PiggyBank, Loader2, Save, AlertCircle } from 'lucide-react';
import { Budget, BudgetCreate, BudgetUpdate, Category } from '../../types/budget';
import { budgetApi } from '../../services/budgetApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
  onSuccess?: () => void;
}

interface FormData {
  nome: string;
  categoria_id: string;
  valor_limite: string;
  periodicidade: 'mensal' | 'quinzenal' | 'semanal';
  notificar_em: string;
}

interface FormErrors {
  nome?: string;
  categoria_id?: string;
  valor_limite?: string;
  periodicidade?: string;
  notificar_em?: string;
}

export function BudgetFormModal({ isOpen, onClose, budget, onSuccess }: BudgetFormModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    categoria_id: '',
    valor_limite: '',
    periodicidade: 'mensal',
    notificar_em: '80'
  });

  const [displayValue, setDisplayValue] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (budget) {
      setFormData({
        nome: budget.nome,
        categoria_id: budget.categoria_id.toString(),
        valor_limite: budget.valor_limite.toString(),
        periodicidade: budget.periodicidade,
        notificar_em: '80' // Default value as backend doesn't return this field
      });
      setDisplayValue(budget.valor_limite.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));
    } else {
      setFormData({
        nome: '',
        categoria_id: '',
        valor_limite: '',
        periodicidade: 'mensal',
        notificar_em: '80'
      });
      setDisplayValue('');
    }
    setErrors({});
  }, [budget, isOpen]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await budgetApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoadingCategories(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    if (!formData.valor_limite || parseFloat(formData.valor_limite) <= 0) {
      newErrors.valor_limite = 'Valor limite deve ser maior que zero';
    }

    if (!formData.periodicidade) {
      newErrors.periodicidade = 'Periodicidade é obrigatória';
    }

    if (!formData.notificar_em || parseFloat(formData.notificar_em) < 0 || parseFloat(formData.notificar_em) > 100) {
      newErrors.notificar_em = 'Percentual deve estar entre 0 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não identificado');
      return;
    }

    setIsLoading(true);

    try {
      if (budget) {
        // Update existing budget
        const updateData: BudgetUpdate = {
          nome: formData.nome,
          valor_limite: parseFloat(formData.valor_limite),
          periodicidade: formData.periodicidade,
          notificar_em: parseFloat(formData.notificar_em)
        };
        await budgetApi.updateBudget(budget.id, updateData);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        // Create new budget
        const createData: BudgetCreate = {
          nome: formData.nome,
          categoria_id: parseInt(formData.categoria_id),
          valor_limite: parseFloat(formData.valor_limite),
          periodicidade: formData.periodicidade,
          notificar_em: parseFloat(formData.notificar_em),
          usuario_id: user.id
        };
        await budgetApi.createBudget(createData);
        toast.success('Orçamento criado com sucesso!');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Erro ao salvar orçamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleCurrencyChange = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');

    if (numbers === '') {
      setDisplayValue('');
      setFormData(prev => ({ ...prev, valor_limite: '' }));
      return;
    }

    // Converte para número (centavos)
    const amount = parseFloat(numbers) / 100;

    // Formata para exibição
    const formatted = amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    setDisplayValue(formatted);
    setFormData(prev => ({ ...prev, valor_limite: amount.toString() }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
            className="relative w-full max-w-md max-h-[85vh] overflow-hidden"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {budget ? 'Atualize as informações do orçamento' : 'Crie um novo orçamento para controlar gastos'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Orçamento *
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Ex: Alimentação, Transporte..."
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`h-10 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 ${
                      errors.nome ? 'border-red-300 dark:border-red-600' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {errors.nome && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.nome}</span>
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria *
                  </Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                    disabled={isLoading || loadingCategories}
                  >
                    <SelectTrigger className={`h-10 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 ${
                      errors.categoria_id ? 'border-red-300 dark:border-red-600' : ''
                    }`}>
                      <SelectValue placeholder={loadingCategories ? "Carregando..." : "Selecione uma categoria"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria_id && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.categoria_id}</span>
                    </div>
                  )}
                </div>

                {/* Valor Limite */}
                <div className="space-y-2">
                  <Label htmlFor="valor_limite" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valor Limite *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      R$
                    </span>
                    <Input
                      id="valor_limite"
                      type="text"
                      placeholder="0,00"
                      value={displayValue}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      className={`h-10 rounded-xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 pl-12 ${
                        errors.valor_limite ? 'border-red-300 dark:border-red-600' : ''
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.valor_limite && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.valor_limite}</span>
                    </div>
                  )}
                </div>

                {/* Periodicidade */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Periodicidade *
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'mensal', label: 'Mensal' },
                      { value: 'quinzenal', label: 'Quinzenal' },
                      { value: 'semanal', label: 'Semanal' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, periodicidade: option.value as any }))}
                        className={`p-2 rounded-xl border transition-all duration-200 ${
                          formData.periodicidade === option.value
                            ? 'bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white border-transparent shadow-lg'
                            : 'bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600/50'
                        }`}
                        disabled={isLoading}
                      >
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.periodicidade && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.periodicidade}</span>
                    </div>
                  )}
                </div>

                {/* Notificar em */}
                <div className="space-y-2">
                  <Label htmlFor="notificar_em" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notificar quando atingir (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="notificar_em"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="80"
                      value={formData.notificar_em}
                      onChange={(e) => setFormData(prev => ({ ...prev, notificar_em: e.target.value }))}
                      className={`h-12 rounded-2xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 pr-12 ${
                        errors.notificar_em ? 'border-red-300 dark:border-red-600' : ''
                      }`}
                      disabled={isLoading}
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      %
                    </span>
                  </div>
                  {errors.notificar_em && (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.notificar_em}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Você será notificado quando o gasto atingir este percentual
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-700/50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {budget ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {budget ? 'Atualizar' : 'Criar Orçamento'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}