import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Phone, Mail, User, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    telefone: '',
    nome: '',
    email: '',
    senha: '',
    confirmSenha: ''
  });

  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').substring(0, 15);
    }
    return value.substring(0, 15);
  };

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
  };

  const passwordValidation = validatePassword(formData.senha);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'telefone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.telefone || !formData.nome || !formData.email || !formData.senha) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!isPasswordValid) {
      toast.error('A senha não atende aos critérios de segurança');
      return;
    }

    if (formData.senha !== formData.confirmSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await register({
        telefone: formData.telefone.replace(/\D/g, ''),
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
      });

      toast.success('Conta criada com sucesso! Faça login para continuar.');
      navigate('/auth/login');
    } catch (error: any) {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-h-screen overflow-y-auto"
    >
      <div className="text-center mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
        >
          Criar conta
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400"
        >
          Comece a gerenciar suas finanças de forma inteligente
        </motion.p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">
              <User className="w-4 h-4 inline mr-2" />
              Nome completo *
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="telefone">
              <Phone className="w-4 h-4 inline mr-2" />
              WhatsApp *
            </Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              className="mt-2"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">
            <Mail className="w-4 h-4 inline mr-2" />
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-2"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="senha">Senha *</Label>
          <div className="relative mt-2">
            <Input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha segura"
              value={formData.senha}
              onChange={(e) => handleInputChange('senha', e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {formData.senha && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">Critérios de segurança:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check className="w-3 h-3 mr-1" />
                  8+ caracteres
                </div>
                <div className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check className="w-3 h-3 mr-1" />
                  Letra maiúscula
                </div>
                <div className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check className="w-3 h-3 mr-1" />
                  Letra minúscula
                </div>
                <div className={`flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check className="w-3 h-3 mr-1" />
                  Número
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="confirmSenha">Confirmar senha *</Label>
          <Input
            id="confirmSenha"
            type="password"
            placeholder="Digite a senha novamente"
            value={formData.confirmSenha}
            onChange={(e) => handleInputChange('confirmSenha', e.target.value)}
            className="mt-2"
            disabled={isLoading}
          />
          {formData.confirmSenha && formData.senha !== formData.confirmSenha && (
            <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Concordo com os{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Política de Privacidade
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB]"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta grátis'
          )}
        </Button>
      </motion.form>

      <div className="text-center mt-6">
        <p className="text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Fazer login
          </Link>
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            {typeof error === 'string' ? error : 'Erro inesperado. Tente novamente.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}