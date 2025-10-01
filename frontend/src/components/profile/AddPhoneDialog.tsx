import { useState } from 'react';
import { Phone, Plus, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { userApi } from '../../services/userApi';

interface AddPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPhone: (phoneNumber: string) => Promise<void>;
}

export function AddPhoneDialog({ open, onOpenChange, onAddPhone }: AddPhoneDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = userApi.formatPhoneInput(value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const validatePhone = (phone: string): boolean => {
    return userApi.validatePhone(phone);
  };

  const handleSubmit = async () => {
    if (!validatePhone(phoneNumber)) {
      setError('Número de telefone inválido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddPhone(phoneNumber);
      setPhoneNumber('');
      onOpenChange(false);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao adicionar telefone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPhoneNumber('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2 text-blue-600" />
            Adicionar Novo Telefone
          </DialogTitle>
          <DialogDescription>
            Digite o número de telefone com DDD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telefone</Label>
            <Input
              id="phone"
              placeholder="(XX) XXXXX-XXXX"
              value={phoneNumber}
              onChange={handlePhoneChange}
              maxLength={15}
              className={error ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              O telefone será usado para notificações via WhatsApp e recuperação de conta.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !phoneNumber}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}