import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useEnhancedDashboard } from '../../hooks/useEnhancedDashboard';

const mockTransactions = [
  {
    id: 1,
    date: '15/12/2024',
    client: 'João Silva',
    description: 'Serviço de consultoria',
    value: 2500,
    status: 'pago' as const,
    category: 'Consultoria'
  },
  {
    id: 2,
    date: '14/12/2024',
    client: 'Maria Santos',
    description: 'Desenvolvimento de site',
    value: -1200,
    status: 'pendente' as const,
    category: 'Desenvolvimento'
  },
  {
    id: 3,
    date: '13/12/2024',
    client: 'Tech Corp',
    description: 'Licença de software',
    value: 5000,
    status: 'pago' as const,
    category: 'Software'
  },
  {
    id: 4,
    date: '12/12/2024',
    client: 'Fornecedor XYZ',
    description: 'Material de escritório',
    value: -890,
    status: 'cancelado' as const,
    category: 'Material'
  },
  {
    id: 5,
    date: '11/12/2024',
    client: 'Cliente ABC',
    description: 'Manutenção mensal',
    value: 1800,
    status: 'pendente' as const,
    category: 'Manutenção'
  },
];

const statusConfig = {
  pago: { 
    label: 'Pago', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' 
  },
  pendente: { 
    label: 'Pendente', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' 
  },
  cancelado: { 
    label: 'Cancelado', 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' 
  },
};

export function ModernTransactionTable() {
  const { data: dashboardData } = useEnhancedDashboard();

  // Use real transaction data from dashboard, fallback to mock for empty states
  const transactions = dashboardData?.transacoes_recentes?.map((transaction: any) => ({
    id: transaction.id,
    date: new Date(transaction.data).toLocaleDateString('pt-BR'),
    client: transaction.cliente || 'Cliente',
    description: transaction.descricao,
    value: transaction.valor,
    status: transaction.status || 'pendente',
    category: transaction.categoria || 'Geral'
  })) || mockTransactions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      whileHover={{ 
        y: -2,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="group"
    >
      <Card className="
        relative overflow-hidden rounded-3xl border-0 bg-white/60 dark:bg-slate-800/60 
        backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500
      "
      style={{
        background: 'var(--card-blur)',
        backdropFilter: 'var(--backdrop-blur)'
      }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-900/10 dark:to-slate-900/10" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        <CardHeader className="relative border-b border-gray-200/30 dark:border-gray-700/30">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-8 bg-gradient-to-b from-gray-500 to-slate-600 rounded-full" />
              <CardTitle>Últimas Transações</CardTitle>
            </div>
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200/30 dark:border-gray-700/30 hover:bg-transparent">
                <TableHead className="text-gray-600 dark:text-gray-400 font-semibold">Data</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400 font-semibold">Categoria</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-400 font-semibold">Descrição</TableHead>
                <TableHead className="text-right text-gray-600 dark:text-gray-400 font-semibold">Valor</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.6 + (index * 0.1),
                    ease: "easeOut"
                  }}
                  className="
                    border-gray-200/20 dark:border-gray-700/20 
                    hover:bg-gray-50/50 dark:hover:bg-gray-800/30 
                    transition-all duration-300 group/row
                  "
                  whileHover={{ scale: 1.01 }}
                >
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 py-4">
                    {transaction.date}
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {transaction.category.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-gray-700 dark:text-gray-300 py-4 max-w-xs">
                    <p className="truncate">{transaction.description}</p>
                  </TableCell>

                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.value > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${
                        transaction.value > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.value > 0 ? '+' : ''}R$ {Math.abs(transaction.value).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-gray-100/20 to-transparent rounded-full translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
      </Card>
    </motion.div>
  );
}