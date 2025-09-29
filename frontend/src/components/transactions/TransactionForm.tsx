import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { CalendarIcon, Save, X, TrendingUp, TrendingDown } from 'lucide-react';
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

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'despesa' as 'despesa' | 'receita',
    categoria_id: '0',
    data_transacao: new Date(),
    mensagem_original: '',
    canal: 'webApp' as string,
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Get categories based on transaction type
  const { categories, loading: categoriesLoading } = useCategories(formData.tipo);

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      setFormData({
        descricao: transaction.descricao || '',
        valor: transaction.valor.toString(),
        tipo: transaction.tipo,
        categoria_id: transaction.categoria?.id?.toString() || '0',
        data_transacao: new Date(transaction.data_transacao),
        mensagem_original: transaction.mensagem_original || '',
        canal: transaction.canal || 'webApp',
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      tipo: formData.tipo,
      categoria_id: formData.categoria_id && formData.categoria_id !== "0" ? parseInt(formData.categoria_id) : undefined,
      data_transacao: formData.data_transacao.toISOString().split('T')[0],
      mensagem_original: formData.mensagem_original || formData.descricao,
      canal: 'webApp',
    };
    console.log('Submitting transaction:', submitData);
    await onSubmit(submitData);
  };

  const handleValueChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setFormData(prev => ({ ...prev, valor: cleanValue }));
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const isIncome = formData.tipo === 'receita';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300",
        "bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50 shadow-xl",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-slate-800/30 dark:to-slate-900/30" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center",
              isIncome
                ? "bg-green-100 dark:bg-green-900/20"
                : "bg-red-100 dark:bg-red-900/20"
            )}>
              {isIncome ? (
                <TrendingUp className={cn(
                  "w-5 h-5",
                  "text-green-600 dark:text-green-400"
                )} />
              ) : (
                <TrendingDown className={cn(
                  "w-5 h-5",
                  "text-red-600 dark:text-red-400"
                )} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                {transaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {isIncome ? 'Receita' : 'Despesa'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="tipo" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: 'despesa' | 'receita') =>
                setFormData(prev => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="descricao" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Almoço no restaurante"
              required
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11 px-4"
            />
          </div>

          {/* Value */}
          <div className="space-y-3">
            <Label htmlFor="valor" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor *</Label>
            <div className="relative">
              <Input
                id="valor"
                value={formData.valor}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="0,00"
                required
                className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11 px-4 pr-20"
              />
              {formData.valor && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {formatCurrency(formData.valor)}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data da Transação *</Label>
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

          {/* Category (placeholder for now) */}
          <div className="space-y-3">
            <Label htmlFor="categoria" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, categoria_id: value }))
              }
            >
              <SelectTrigger className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 h-11" disabled={categoriesLoading}>
                <SelectValue placeholder={categoriesLoading ? "Carregando categorias..." : "Selecione uma categoria"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0">Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Original Message (optional) */}
          {transaction?.mensagem_original == transaction?.descricao && (
            <div className="space-y-3">
              <Label htmlFor="mensagem_original" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mensagem Original</Label>
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
          <div className="flex items-center justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/70 hover:bg-gray-50 dark:hover:bg-slate-700 px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.descricao || !formData.valor}
              className={cn(
                "rounded-xl px-6 font-semibold shadow-lg",
                isIncome
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {transaction ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}