import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

const transactions = [
  {
    id: 1,
    date: '15/12/2024',
    client: 'João Silva',
    description: 'Serviço de consultoria',
    value: 2500,
    status: 'pago' as const,
  },
  {
    id: 2,
    date: '14/12/2024',
    client: 'Maria Santos',
    description: 'Desenvolvimento de site',
    value: -1200,
    status: 'pendente' as const,
  },
  {
    id: 3,
    date: '13/12/2024',
    client: 'Tech Corp',
    description: 'Licença de software',
    value: 5000,
    status: 'pago' as const,
  },
  {
    id: 4,
    date: '12/12/2024',
    client: 'Fornecedor XYZ',
    description: 'Material de escritório',
    value: -890,
    status: 'cancelado' as const,
  },
  {
    id: 5,
    date: '11/12/2024',
    client: 'Cliente ABC',
    description: 'Manutenção mensal',
    value: 1800,
    status: 'pendente' as const,
  },
];

const statusConfig = {
  pago: { label: 'Pago', variant: 'default' as const, className: 'bg-[#22C55E] text-white' },
  pendente: { label: 'Pendente', variant: 'secondary' as const, className: 'bg-yellow-500 text-white' },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-red-500 text-white' },
};

export function TransactionTable() {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{transaction.date}</TableCell>
                <TableCell>{transaction.client}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell 
                  className={`text-right font-semibold ${
                    transaction.value > 0 ? 'text-[#22C55E]' : 'text-red-500'
                  }`}
                >
                  {transaction.value > 0 ? '+' : ''}R$ {Math.abs(transaction.value).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={statusConfig[transaction.status].variant}
                    className={`${statusConfig[transaction.status].className} rounded-xl`}
                  >
                    {statusConfig[transaction.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}