import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';

interface Charge {
  id?: number;
  description: string;
  client: string;
  value: string;
  dueDate: string;
  channel: 'whatsapp' | 'email';
}

interface ChargeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  charge?: Charge | null;
}

const clients = [
  'João Silva',
  'Maria Santos',
  'Tech Corp',
  'Cliente ABC',
  'Fornecedor XYZ',
];

export function ChargeFormModal({ isOpen, onClose, charge }: ChargeFormModalProps) {
  const [formData, setFormData] = useState<Charge>({
    description: '',
    client: '',
    value: '',
    dueDate: '',
    channel: 'whatsapp',
  });

  useEffect(() => {
    if (charge) {
      setFormData({
        ...charge,
        value: charge.value?.toString() || '',
      });
    } else {
      setFormData({
        description: '',
        client: '',
        value: '',
        dueDate: '',
        channel: 'whatsapp',
      });
    }
  }, [charge, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    
    if (!formData.client) {
      toast.error('Cliente é obrigatório');
      return;
    }
    
    if (!formData.value || parseFloat(formData.value) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    
    if (!formData.dueDate) {
      toast.error('Data de vencimento é obrigatória');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success(charge ? 'Cobrança atualizada com sucesso!' : 'Cobrança criada com sucesso!');
      onClose();
    }, 500);
  };

  const handleChange = (field: keyof Charge, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {charge ? 'Editar Cobrança' : 'Nova Cobrança'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={formData.client} onValueChange={(value) => handleChange('client', value)}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)}
              placeholder="0,00"
              className="rounded-2xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o serviço ou produto"
              className="rounded-2xl min-h-20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimento *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="rounded-2xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Canal de Envio</Label>
            <Select value={formData.channel} onValueChange={(value) => handleChange('channel', value as 'whatsapp' | 'email')}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-2xl"
            >
              {charge ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}