import { useState } from 'react';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
}

const mockClients: Client[] = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    document: '987.654.321-00',
  },
  {
    id: 3,
    name: 'Tech Corp LTDA',
    email: 'contato@techcorp.com',
    phone: '(11) 77777-7777',
    document: '12.345.678/0001-90',
  },
];

interface ClientTableProps {
  onNewClient: () => void;
  onEditClient: (client: Client) => void;
}

export function ClientTable({ onNewClient, onEditClient }: ClientTableProps) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.includes(searchTerm)
  );

  const handleDeleteClient = (id: number) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Clientes</CardTitle>
          <Button 
            onClick={onNewClient}
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 rounded-2xl"
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.document}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClient(client)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
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