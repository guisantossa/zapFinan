import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Edit, Trash2, TrendingUp, TrendingDown, MessageCircle, Image, Mic, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, PaginatedTransactions } from '../../types/transaction';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

interface TransactionTableProps {
  data: PaginatedTransactions;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function TransactionTable({
  data,
  onEdit,
  onDelete,
  onPageChange,
  isLoading = false,
  className
}: TransactionTableProps) {
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

  const totalPages = Math.ceil(data.total / data.size);
  const hasNextPage = data.page < totalPages;
  const hasPrevPage = data.page > 1;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data.items.length) {
    return (
      <div className={cn(
        "text-center py-12 rounded-3xl backdrop-blur-xl border",
        "bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50",
        className
      )}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhuma transação encontrada
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Crie sua primeira transação ou ajuste os filtros para ver resultados.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-xl border bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200/50 dark:border-gray-700/50">
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Descrição</TableHead>
              <TableHead className="font-semibold">Categoria</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Canal</TableHead>
              <TableHead className="font-semibold text-right">Valor</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {data.items.map((transaction, index) => {
                const isIncome = transaction.tipo === 'receita';
                const date = new Date(transaction.data_transacao);
                const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });

                return (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Type */}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          "bg-gray-100 dark:bg-gray-800/50"
                        )}>
                          {isIncome ? (
                            <TrendingUp className={cn(
                              "w-4 h-4",
                              "text-green-600 dark:text-green-400"
                            )} />
                          ) : (
                            <TrendingDown className={cn(
                              "w-4 h-4",
                              "text-red-600 dark:text-red-400"
                            )} />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {transaction.descricao}
                        </p>
                        {transaction.mensagem_original !== transaction.descricao && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            "{transaction.mensagem_original}"
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {transaction.categoria ? (
                        <Badge variant="outline" className="rounded-lg">
                          {transaction.categoria.nome}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formattedDate}
                      </span>
                    </TableCell>

                    {/* Channel */}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">
                          {getChannelIcon(transaction.canal)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getChannelLabel(transaction.canal)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-semibold",
                        isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.valor))}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl backdrop-blur-xl border bg-white/60 dark:bg-slate-800/60 border-gray-200/50 dark:border-gray-700/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {(data.page - 1) * data.size + 1} a {Math.min(data.page * data.size, data.total)} de {data.total} transações
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(data.page - 1)}
              disabled={!hasPrevPage}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (data.page <= 3) {
                  pageNum = i + 1;
                } else if (data.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = data.page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={data.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum)}
                    className="w-8 h-8 p-0 rounded-xl"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(data.page + 1)}
              disabled={!hasNextPage}
              className="rounded-xl"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}