import { useState, useEffect } from 'react';
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { UserPhone, userApi } from '../../services/userApi';
import { toast } from 'sonner';

interface VerifyPhoneDialogProps {
  phone: UserPhone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (phone: UserPhone) => void;
}

export function VerifyPhoneDialog({
  phone,
  open,
  onOpenChange,
  onVerified
}: VerifyPhoneDialogProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [verificationCode, setVerificationCode] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(5);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep('request');
      setVerificationCode('');
      setError(null);
      setDevCode(null);
    }
  }, [open]);

  const handleRequestVerification = async () => {
    if (!phone) return;

    setIsRequesting(true);
    setError(null);

    try {
      const response = await userApi.requestPhoneVerification(phone.id);
      setExpiresIn(response.expires_in_minutes);

      // Se estiver em dev mode e retornar código
      if (response.code) {
        setDevCode(response.code);
        toast.info(`Código de desenvolvimento: ${response.code}`);
      }

      toast.success('Código enviado via SMS!');
      setStep('verify');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao solicitar verificação';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (!phone) return;

    if (verificationCode.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const verifiedPhone = await userApi.verifyPhone(phone.id, verificationCode);
      toast.success('Telefone verificado com sucesso!');
      onVerified(verifiedPhone);
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Código inválido ou expirado';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError(null);
  };

  const handleClose = () => {
    if (!isRequesting && !isVerifying) {
      onOpenChange(false);
    }
  };

  if (!phone) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Verificar Telefone
          </DialogTitle>
          <DialogDescription>
            {step === 'request' ? (
              'Enviaremos um código de verificação via SMS para este número'
            ) : (
              'Digite o código de 6 dígitos enviado via SMS'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Number Display */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Número de Telefone
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {userApi.formatPhoneNumber(phone.phone_number)}
            </p>
          </div>

          {/* Request Step */}
          {step === 'request' && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Você receberá um código de 6 dígitos válido por {expiresIn} minutos.
              </p>
            </div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  maxLength={6}
                  className={`text-center text-2xl tracking-widest font-mono ${
                    error ? 'border-red-500' : ''
                  }`}
                  disabled={isVerifying}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error}
                  </p>
                )}
              </div>

              {/* Dev Mode Code Display */}
              {devCode && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-1 font-semibold">
                    🔧 Modo Desenvolvimento
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Código: <span className="font-mono font-bold">{devCode}</span>
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  O código expira em {expiresIn} minutos
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {step === 'request' ? (
            <Button
              onClick={handleRequestVerification}
              disabled={isRequesting}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Enviar Código
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('request');
                  setVerificationCode('');
                  setError(null);
                }}
                disabled={isVerifying}
                className="w-full sm:w-auto text-sm"
              >
                Não recebeu o código?
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verificar
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}