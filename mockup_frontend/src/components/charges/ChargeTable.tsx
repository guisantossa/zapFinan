import { useState } from 'react';
import { Edit, Trash2, Plus, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface Charge {
  id: number;
  description: string;
  client: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'cancelado';
  channel: 'whatsapp' | 'email';
}

const mockCharges: Charge[] = [
  {
    id: 1,
    description: 'Serviço de consultoria',
    client: 'João Silva',
    value: 2500,
    dueDate: '2024-12-20',
    status: 'pendente',
    channel: 'whatsapp',
  },
  {
    id: 2,
    description: 'Desenvolvimento de site',
    client: 'Maria Santos',
    value: 5000,
    dueDate: '2024-12-25',
    status: 'pago',
    channel: 'email',
  },
  {
    id: 3,
    description: 'Manutenção mensal',
    client: 'Tech Corp',
    value: 1800,
    dueDate: '2024-12-30',
    status: 'pendente',
    channel: 'whatsapp',
  },
  {
    id: 4,
    description: 'Licença de software',
    client: 'Cliente ABC',
    value: 890,
    dueDate: '2024-12-15',
    status: 'cancelado',
    channel: 'email',
  },
];

const statusConfig = {
  pago: { label: 'Pago', className: 'bg-[#22C55E] text-white' },
  pendente: { label: 'Pendente', className: 'bg-yellow-500 text-white' },
  cancelado: { label: 'Cancelado', className: 'bg-red-500 text-white' },
};

interface ChargeTableProps {
  onNewCharge: () => void;
  onEditCharge: (charge: Charge) => void;
}

export function ChargeTable({ onNewCharge, onEditCharge }: ChargeTableProps) {
  const [charges, setCharges] = useState<Charge[]>(mockCharges);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCharges = charges.filter(charge => {
    const matchesSearch = charge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         charge.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || charge.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteCharge = (id: number) => {
    setCharges(prev => prev.filter(charge => charge.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cobranças</CardTitle>
          <Button 
            onClick={onNewCharge}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar cobranças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 rounded-2xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 rounded-2xl">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCharges.map((charge) => (
              <TableRow key={charge.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{charge.description}</TableCell>
                <TableCell>{charge.client}</TableCell>
                <TableCell className="text-right font-semibold">
                  R$ {charge.value.toLocaleString()}
                </TableCell>
                <TableCell>{formatDate(charge.dueDate)}</TableCell>
                <TableCell>
                  <Badge 
                    className={`${statusConfig[charge.status].className} rounded-xl`}
                  >
                    {statusConfig[charge.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCharge(charge)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCharge(charge.id)}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}