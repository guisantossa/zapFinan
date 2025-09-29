import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Phone, Mail, Loader2, MessageCircle, DollarSign, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

export function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'sms'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSMSStep, setIsSMSStep] = useState(false);

  // Password login form
  const [identifier, setIdentifier] = useState('');
  const [senha, setSenha] = useState('');

  // SMS login form
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsToken, setSmsToken] = useState('');

  const { login, loginWithSMS, verifySMSToken, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await login({ identifier, senha });
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (error: any) {
      // Error already handled by context and toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSMSLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSMSStep) {
      // Step 1: Send SMS token
      if (!phoneNumber) {
        toast.error('Digite seu número de telefone');
        return;
      }

      setIsLoading(true);
      clearError();

      try {
        await loginWithSMS(phoneNumber);
        setIsSMSStep(true);
        toast.success('Código SMS enviado! Verifique seu WhatsApp.');
      } catch (error: any) {
        // Error already handled by context and toast
      } finally {
        setIsLoading(false);
      }
    } else {
      // Step 2: Verify SMS token
      if (!smsToken) {
        toast.error('Digite o código recebido por SMS');
        return;
      }

      setIsLoading(true);
      clearError();

      try {
        await verifySMSToken(smsToken);
        toast.success('Login realizado com sucesso!');
        navigate(from, { replace: true });
      } catch (error: any) {
        // Error already handled by context and toast
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').substring(0, 15);
    }
    return value.substring(0, 15);
  };

  const resetSMSFlow = () => {
    setIsSMSStep(false);
    setSmsToken('');
    clearError();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#FAFBFC] via-blue-50/30 to-indigo-100/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 20
        }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Premium Glass Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl shadow-2xl border border-white/20 dark:border-slate-700/50">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10" />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full translate-y-12 -translate-x-12" />

          <div className="relative z-10 p-8 sm:p-10">
            {/* Brand Logo & Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-2xl mb-6 shadow-lg"
              >
                <DollarSign className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2"
              >
                Bem-vindo de volta
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Acesse sua conta de forma segura
              </motion.p>
            </div>

            {/* Premium Login Method Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl p-1 mb-8 border border-white/20 dark:border-slate-600/50"
            >

              <div className="relative flex">
                <button
                  onClick={() => {
                    setLoginMethod('password');
                    resetSMSFlow();
                  }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 z-10 ${
                    loginMethod === 'password'
                      ? 'text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>Telefone</span>
                </button>
                <button
                  onClick={() => {
                    setLoginMethod('sms');
                    resetSMSFlow();
                  }}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 z-10 ${
                    loginMethod === 'sms'
                      ? 'text-white bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Token WhatsApp</span>
                </button>
              </div>
            </motion.div>

            {/* Password Login Form */}
            {loginMethod === 'password' && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onSubmit={handlePasswordLogin}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone
                  </Label>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Digite seu telefone"
                      value={identifier}
                      onChange={(e) => setIdentifier(formatPhoneNumber(e.target.value))}
                      className="pl-12 h-14 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl border-white/20 dark:border-slate-600/50 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300"
                      disabled={isLoading}
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-14 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl border-white/20 dark:border-slate-600/50 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 rounded transition-colors duration-200"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Lembrar de mim
                    </label>
                  </div>

                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-[#3B82F6] hover:text-[#1E3A8A] dark:text-blue-400 transition-colors duration-200 font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            )}

            {/* SMS Login Form */}
            {loginMethod === 'sms' && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                onSubmit={handleSMSLogin}
                className="space-y-8"
              >
                {!isSMSStep ? (
                  <>
                    {/* Step 1: Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Número do WhatsApp
                      </Label>
                      <div className="relative">
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                          className="pl-12 h-14 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl border-white/20 dark:border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
                          disabled={isLoading}
                        />
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Enviaremos um código de verificação via WhatsApp
                      </p>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Button
                        type="submit"
                        className="w-full h-14 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando código...
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar código SMS
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Step 2: SMS Token */}
                    <div className="space-y-2">
                      <Label htmlFor="smsToken" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código de Verificação
                      </Label>
                      <Input
                        id="smsToken"
                        type="text"
                        placeholder="000000"
                        value={smsToken}
                        onChange={(e) => setSmsToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        className="h-16 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl border-white/20 dark:border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 text-center text-2xl tracking-widest font-mono"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Código enviado para <span className="font-medium text-green-600 dark:text-green-400">{phoneNumber}</span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-14 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0 mb-3"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Verificar código
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 rounded-2xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-xl border-white/20 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300"
                        onClick={resetSMSFlow}
                        disabled={isLoading}
                      >
                        Usar outro número
                      </Button>
                    </div>
                  </>
                )}
              </motion.form>
            )}

            {/* Premium Divider */}
            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl text-gray-500 dark:text-gray-400 rounded-full border border-white/20 dark:border-slate-600/50">
                  ou
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Não tem uma conta?{' '}
                <Link
                  to="/auth/register"
                  className="font-semibold text-[#3B82F6] hover:text-[#1E3A8A] dark:text-blue-400 transition-colors duration-200"
                >
                  Criar conta grátis
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50"
        >
          <div className="p-4 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-xl border border-red-200/50 dark:border-red-800/50 rounded-2xl shadow-xl">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              {typeof error === 'string' ? error : 'Erro inesperado. Tente novamente.'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}