import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { userApi, UserPhone } from '../../services/userApi';
import { toast } from 'sonner';
import { PhoneList } from './PhoneList';
import { AddPhoneDialog } from './AddPhoneDialog';
import { DeletePhoneDialog } from './DeletePhoneDialog';
import { VerifyPhoneDialog } from './VerifyPhoneDialog';

export function PhoneManagement() {
  // States
  const [phones, setPhones] = useState<UserPhone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState<UserPhone | null>(null);
  const [phoneToVerify, setPhoneToVerify] = useState<UserPhone | null>(null);

  // Effects
  useEffect(() => {
    loadPhones();
  }, []);

  // Handlers
  const loadPhones = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getUserPhones();
      setPhones(response.phones);
    } catch (error) {
      console.error('Erro ao carregar telefones:', error);
      toast.error('Erro ao carregar telefones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhone = async (phoneNumber: string) => {
    const newPhone = await userApi.addPhone(phoneNumber);
    setPhones([...phones, newPhone]);
    toast.success('Telefone adicionado com sucesso!');
  };

  const handleSetPrimary = async (phoneId: string) => {
    try {
      await userApi.setPhonePrimary(phoneId);

      setPhones(phones.map(phone => ({
        ...phone,
        is_primary: phone.id === phoneId
      })));

      toast.success('Telefone principal atualizado');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao definir telefone principal');
      throw error;
    }
  };

  const handleDeletePhone = async (phoneId: string) => {
    await userApi.deletePhone(phoneId);
    setPhones(phones.filter(phone => phone.id !== phoneId));
    toast.success('Telefone removido com sucesso');
  };

  const handleDeleteClick = (phone: UserPhone) => {
    setPhoneToDelete(phone);
  };

  const handleVerifyClick = (phone: UserPhone) => {
    setPhoneToVerify(phone);
  };

  const handlePhoneVerified = (verifiedPhone: UserPhone) => {
    setPhones(phones.map(phone =>
      phone.id === verifiedPhone.id ? verifiedPhone : phone
    ));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl">
            <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Meus Telefones
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie os telefones conectados à sua conta
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Telefone
        </Button>
      </motion.div>

      {/* Phone List */}
      <PhoneList
        phones={phones}
        onSetPrimary={handleSetPrimary}
        onDelete={handleDeleteClick}
        onVerify={handleVerifyClick}
        onAddClick={() => setIsAddDialogOpen(true)}
        isLoading={isLoading}
      />

      {/* Dialogs */}
      <AddPhoneDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddPhone={handleAddPhone}
      />

      <DeletePhoneDialog
        phone={phoneToDelete}
        open={!!phoneToDelete}
        onOpenChange={(open) => !open && setPhoneToDelete(null)}
        onConfirmDelete={handleDeletePhone}
      />

      <VerifyPhoneDialog
        phone={phoneToVerify}
        open={!!phoneToVerify}
        onOpenChange={(open) => !open && setPhoneToVerify(null)}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
}