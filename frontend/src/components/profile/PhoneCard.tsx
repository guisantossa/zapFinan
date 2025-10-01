import { useState } from 'react';
import { Phone, Check, Trash2, CheckCircle, AlertCircle, Calendar, Loader2, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserPhone, userApi } from '../../services/userApi';

interface PhoneCardProps {
  phone: UserPhone;
  onSetPrimary: (phoneId: string) => void;
  onDelete: (phone: UserPhone) => void;
  onVerify: (phone: UserPhone) => void;
}

export function PhoneCard({ phone, onSetPrimary, onDelete, onVerify }: PhoneCardProps) {
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);

  const handleSetPrimary = async () => {
    setIsSettingPrimary(true);
    try {
      await onSetPrimary(phone.id);
    } finally {
      setIsSettingPrimary(false);
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Icon + Phone info */}
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex-shrink-0">
              <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="space-y-3 min-w-0 flex-1">
              {/* Número formatado */}
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 break-all">
                {userApi.formatPhoneNumber(phone.phone_number)}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {phone.is_primary && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                    <Check className="w-3 h-3 mr-1" />
                    Principal
                  </Badge>
                )}
                {phone.is_verified ? (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Não verificado
                  </Badge>
                )}
                {!phone.is_active && (
                  <Badge variant="outline" className="text-red-600 dark:text-red-400">
                    Inativo
                  </Badge>
                )}
              </div>

              {/* Data de criação */}
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Adicionado em {userApi.formatDate(phone.created_at)}
              </p>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {/* Botão Verificar - apenas se não verificado */}
            {!phone.is_verified && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerify(phone)}
                className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/50 whitespace-nowrap"
              >
                <Shield className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Verificar</span>
              </Button>
            )}

            {/* Botão Definir Principal - apenas se não for principal */}
            {!phone.is_primary && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetPrimary}
                disabled={isSettingPrimary}
                className="whitespace-nowrap"
              >
                {isSettingPrimary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Definir Principal</span>
                  </>
                )}
              </Button>
            )}

            {/* Botão Remover - apenas se não for principal */}
            {!phone.is_primary && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(phone)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Remover</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}