import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PERIOD_OPTIONS, PeriodFilter as PeriodFilterType } from '../../types/dashboard';

interface PeriodFilterProps {
  currentPeriod: PeriodFilterType;
  customDates: { data_inicio: string; data_fim: string } | null;
  onPeriodChange: (period: string) => void;
  onCustomPeriodChange: (dataInicio: string, dataFim: string) => void;
  isLoading?: boolean;
}

export function PeriodFilter({
  currentPeriod,
  customDates,
  onPeriodChange,
  onCustomPeriodChange,
  isLoading = false
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(customDates?.data_inicio || '');
  const [tempEndDate, setTempEndDate] = useState(customDates?.data_fim || '');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handlePeriodSelect = (periodValue: string) => {
    if (periodValue === 'custom') {
      setShowCustomForm(true);
    } else {
      onPeriodChange(periodValue);
      setIsOpen(false);
      setShowCustomForm(false);
    }
  };

  const handleCustomApply = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) <= new Date(tempEndDate)) {
        onCustomPeriodChange(tempStartDate, tempEndDate);
        setIsOpen(false);
        setShowCustomForm(false);
      }
    }
  };

  const handleCustomCancel = () => {
    setTempStartDate(customDates?.data_inicio || '');
    setTempEndDate(customDates?.data_fim || '');
    setShowCustomForm(false);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (currentPeriod.value === 'custom' && customDates) {
      const startDate = new Date(customDates.data_inicio).toLocaleDateString('pt-BR');
      const endDate = new Date(customDates.data_fim).toLocaleDateString('pt-BR');
      return `${startDate} - ${endDate}`;
    }
    return currentPeriod.label;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50 min-w-[200px] justify-between"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50"
          >
            <div className="p-4">
              {!showCustomForm ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Selecionar Período
                  </h3>
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePeriodSelect(option.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        currentPeriod.value === option.value
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                          : 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600/50'
                      }`}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      {currentPeriod.value === option.value && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Período Personalizado
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Data de Início
                      </label>
                      <Input
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Data de Fim
                      </label>
                      <Input
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        min={tempStartDate}
                        className="bg-white/70 dark:bg-slate-700/70 border-gray-200/50 dark:border-gray-600/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCustomCancel}
                      className="flex-1 bg-white/70 dark:bg-slate-700/70"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCustomApply}
                      disabled={!tempStartDate || !tempEndDate || new Date(tempStartDate) > new Date(tempEndDate)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowCustomForm(false);
          }}
        />
      )}
    </div>
  );
}