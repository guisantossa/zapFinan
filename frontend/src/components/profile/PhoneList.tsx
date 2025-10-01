import { motion } from 'motion/react';
import { Phone, Plus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { PhoneCard } from './PhoneCard';
import { UserPhone } from '../../services/userApi';

interface PhoneListProps {
  phones: UserPhone[];
  onSetPrimary: (phoneId: string) => void;
  onDelete: (phone: UserPhone) => void;
  onVerify: (phone: UserPhone) => void;
  onAddClick: () => void;
  isLoading?: boolean;
}

export function PhoneList({ phones, onSetPrimary, onDelete, onVerify, onAddClick, isLoading }: PhoneListProps) {
  if (isLoading) {
    return <PhoneListSkeleton />;
  }

  if (phones.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  return (
    <motion.div className="space-y-4">
      {phones.map((phone, index) => (
        <motion.div
          key={phone.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <PhoneCard
            phone={phone}
            onSetPrimary={onSetPrimary}
            onDelete={onDelete}
            onVerify={onVerify}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function PhoneListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Phone className="w-12 h-12 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Nenhum telefone cadastrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Adicione um telefone para receber notificações e alertas via WhatsApp
            </p>
          </div>
          <Button onClick={onAddClick} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Telefone
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}