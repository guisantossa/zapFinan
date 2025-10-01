import { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '../ui/alert-dialog';
import { UserPhone, userApi } from '../../services/userApi';

interface DeletePhoneDialogProps {
  phone: UserPhone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (phoneId: string) => Promise<void>;
}

export function DeletePhoneDialog({
  phone,
  open,
  onOpenChange,
  onConfirmDelete
}: DeletePhoneDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!phone) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(phone.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting phone:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!phone) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Remover Telefone
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Tem certeza que deseja remover este telefone?</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {userApi.formatPhoneNumber(phone.phone_number)}
              </p>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}