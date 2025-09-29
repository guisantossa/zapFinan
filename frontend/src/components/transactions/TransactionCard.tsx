import { motion } from 'motion/react';
import { MoreVertical, Edit, Trash2, TrendingUp, TrendingDown, MessageCircle, Image, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '../../types/transaction';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  className?: string;
}

export function TransactionCard({ transaction, onEdit, onDelete, className }: TransactionCardProps) {
  const isIncome = transaction.tipo === 'receita';
  const date = new Date(transaction.data_transacao);
  const formattedDate = format(date, "d 'de' MMMM", { locale: ptBR });
  const formattedTime = format(new Date(transaction.data_registro), 'HH:mm', { locale: ptBR });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getChannelIcon = (canal?: string) => {
    switch (canal) {
      case 'audioMessage':
        return <Mic className="w-4 h-4" />;
      case 'imageMessage':
        return <Image className="w-4 h-4" />;
      case 'conversation':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (canal?: string) => {
    switch (canal) {
      case 'audioMessage':
        return 'Áudio';
      case 'imageMessage':
        return 'Imagem';
      case 'conversation':
        return 'Texto';
      default:
        return 'Manual';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl backdrop-blur-xl border transition-all duration-300 hover:shadow-xl",
        "bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50 hover:shadow-gray-500/10",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-slate-800/30 dark:to-slate-900/30" />

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Type icon */}
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

            {/* Category and channel info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  {isIncome ? 'Receita' : 'Despesa'}
                </span>
                {transaction.categoria && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.categoria.nome}
                    </span>
                  </>
                )}
              </div>

              {/* Channel info */}
              {transaction.canal && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  {getChannelIcon(transaction.canal)}
                  <span>{getChannelLabel(transaction.canal)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(transaction)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {transaction.descricao}
        </h3>

        {/* Original message (if different from description) */}
        {transaction.mensagem_original !== transaction.descricao && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
            "{transaction.mensagem_original}"
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Date and time */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div>{formattedDate}</div>
            <div className="text-xs">{formattedTime}</div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <div className={cn(
              "text-xl font-bold",
              isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.valor))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 from-transparent via-white dark:via-gray-800 to-transparent" />
    </motion.div>
  );
}