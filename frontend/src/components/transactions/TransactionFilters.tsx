import { motion } from 'motion/react';
import { useState } from 'react';
import { Filter, X, Search, Calendar, DollarSign, Tag, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TransactionFilters } from '../../types/transaction';
import { cn } from '../ui/utils';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Badge } from '../ui/badge';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  className?: string;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  activeFiltersCount,
  className
}: TransactionFiltersProps) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleFilterChange = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateRangeChange = (start?: Date, end?: Date) => {
    onFiltersChange({
      ...filters,
      data_inicio: start ? start.toISOString().split('T')[0] : undefined,
      data_fim: end ? end.toISOString().split('T')[0] : undefined,
    });
  };

  const handleAmountRangeChange = (min?: string, max?: string) => {
    onFiltersChange({
      ...filters,
      valor_min: min ? parseFloat(min) : undefined,
      valor_max: max ? parseFloat(max) : undefined,
    });
  };

  const getActiveFilterLabels = () => {
    const labels: string[] = [];

    if (filters.tipo) {
      labels.push(filters.tipo === 'receita' ? 'Receitas' : 'Despesas');
    }

    if (filters.categoria_id) {
      labels.push(`Categoria: ${filters.categoria_id}`);
    }

    if (filters.data_inicio || filters.data_fim) {
      if (filters.data_inicio && filters.data_fim) {
        labels.push(`${filters.data_inicio} - ${filters.data_fim}`);
      } else if (filters.data_inicio) {
        labels.push(`A partir de ${filters.data_inicio}`);
      } else if (filters.data_fim) {
        labels.push(`Até ${filters.data_fim}`);
      }
    }

    if (filters.valor_min || filters.valor_max) {
      if (filters.valor_min && filters.valor_max) {
        labels.push(`R$ ${filters.valor_min} - R$ ${filters.valor_max}`);
      } else if (filters.valor_min) {
        labels.push(`Min: R$ ${filters.valor_min}`);
      } else if (filters.valor_max) {
        labels.push(`Max: R$ ${filters.valor_max}`);
      }
    }

    return labels;
  };

  const startDate = filters.data_inicio ? new Date(filters.data_inicio) : undefined;
  const endDate = filters.data_fim ? new Date(filters.data_fim) : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar transações..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10 pr-4 h-12 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Quick Type Filters */}
          <div className="flex space-x-2">
            <Button
              variant={filters.tipo === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('tipo', undefined)}
              className="rounded-xl"
            >
              Todas
            </Button>
            <Button
              variant={filters.tipo === 'receita' ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('tipo', 'receita')}
              className={cn(
                "rounded-xl",
                filters.tipo === 'receita' && "bg-green-600 hover:bg-green-700"
              )}
            >
              Receitas
            </Button>
            <Button
              variant={filters.tipo === 'despesa' ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('tipo', 'despesa')}
              className={cn(
                "rounded-xl",
                filters.tipo === 'despesa' && "bg-red-600 hover:bg-red-700"
              )}
            >
              Despesas
            </Button>
          </div>
        </div>

        {/* Advanced Filters Trigger */}
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}

          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative rounded-xl">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Filtros Avançados</SheetTitle>
                <SheetDescription>
                  Configure filtros detalhados para suas transações
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Type Filter */}
                <div className="space-y-2">
                  <Label>Tipo de Transação</Label>
                  <Select
                    value={filters.tipo || ''}
                    onValueChange={(value) =>
                      handleFilterChange('tipo', value === '' ? undefined : value as 'despesa' | 'receita')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="receita">Receitas</SelectItem>
                      <SelectItem value="despesa">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={filters.categoria_id?.toString() || ''}
                    onValueChange={(value) =>
                      handleFilterChange('categoria_id', value === '' ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {/* TODO: Load categories from API */}
                      <SelectItem value="1">Alimentação</SelectItem>
                      <SelectItem value="2">Transporte</SelectItem>
                      <SelectItem value="3">Lazer</SelectItem>
                      <SelectItem value="4">Saúde</SelectItem>
                      <SelectItem value="5">Educação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <Label>Período</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Data início</Label>
                      <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Início</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              handleDateRangeChange(date, endDate);
                              setIsStartDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Data fim</Label>
                      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Fim</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              handleDateRangeChange(startDate, date);
                              setIsEndDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-3">
                  <Label>Faixa de Valores</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Valor mínimo</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={filters.valor_min || ''}
                        onChange={(e) => handleAmountRangeChange(e.target.value, filters.valor_max?.toString())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-500">Valor máximo</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={filters.valor_max || ''}
                        onChange={(e) => handleAmountRangeChange(filters.valor_min?.toString(), e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <Button onClick={() => setIsFiltersOpen(false)}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {getActiveFilterLabels().map((label, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg"
            >
              {label}
            </Badge>
          ))}
        </motion.div>
      )}
    </div>
  );
}