import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Settings,
  CreditCard,
  Shield,
  Bell,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Check,
  X,
  Edit3,
  Save,
  Eye,
  EyeOff,
  Crown,
  BarChart3
} from 'lucide-react';
import { PhoneManagement } from '../components/profile/PhoneManagement';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { userApi, UserProfile, Plan, UpdateUserData } from '../services/userApi';
import { toast } from 'sonner';

export function PerfilPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const formatPhone = (phone: string) => {
    if (!phone) return 'Não informado';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const [profileData, plans] = await Promise.all([
        userApi.getUserProfile(),
        userApi.getAvailablePlans()
      ]);
      setProfile(profileData);
      setAvailablePlans(plans);
      setEditForm({
        nome: profileData.user.nome,
        email: profileData.user.email
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await userApi.updateUser(editForm);
      toast.success('Perfil atualizado com sucesso');
      setIsEditing(false);
      loadProfileData();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      await userApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Senha alterada com sucesso');
      setShowPasswordForm(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await userApi.requestEmailVerification();
      toast.success('Email de verificação enviado');
    } catch (error) {
      console.error('Erro ao enviar verificação:', error);
      toast.error('Erro ao enviar email de verificação');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Erro ao carregar perfil</p>
        <Button onClick={loadProfileData} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                  {profile.user.nome || 'Meu Perfil'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie suas informações pessoais, segurança e preferências • Membro desde {userApi.formatDate(profile.user.data_inicio)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={profile.user.is_active ? 'default' : 'destructive'}>
                {profile.user.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
              {profile.user.email_verified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8 overflow-x-auto">
              <TabsList className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 rounded-2xl shadow-lg min-w-fit">
                <TabsTrigger value="personal" className="min-w-fit">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>Informações Pessoais</span>
                </TabsTrigger>
                <TabsTrigger value="phones" className="min-w-fit">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>Telefones</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="min-w-fit">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Segurança</span>
                </TabsTrigger>
                <TabsTrigger value="plan" className="min-w-fit">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span>Plano</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <UserIcon className="w-5 h-5 mr-2" />
                          Informações Pessoais
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isEditing) {
                              setEditForm({
                                nome: profile.user.nome,
                                email: profile.user.email
                              });
                            }
                            setIsEditing(!isEditing);
                          }}
                        >
                          {isEditing ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="nome" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nome completo</Label>
                          {isEditing ? (
                            <Input
                              id="nome"
                              value={editForm.nome || ''}
                              onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                              placeholder="Seu nome completo"
                              className="font-medium text-gray-900 dark:text-gray-100"
                            />
                          ) : (
                            <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-2">
                              {profile.user.nome || 'Não informado'}
                            </p>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="telefone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Telefone</Label>
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100 mt-2 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {formatPhone(profile.user.telefone)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="seu@email.com"
                            className="font-medium text-gray-900 dark:text-gray-100"
                          />
                        ) : (
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-500" />
                              {profile.user.email || 'Não informado'}
                            </p>
                            {profile.user.email && !profile.user.email_verified && (
                              <Button size="sm" variant="outline" onClick={handleVerifyEmail}>
                                Verificar Email
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex justify-end space-x-2">
                          <Button onClick={handleUpdateProfile}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      )}

                      <Separator className="my-8" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Último login</Label>
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center mt-2">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            {profile.user.last_login_at
                              ? userApi.formatDateTime(profile.user.last_login_at)
                              : 'Nunca'
                            }
                          </p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Membro desde</Label>
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100 flex items-center mt-2">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            {userApi.formatDate(profile.user.data_inicio)}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status da conta</Label>
                          <div className="flex items-center mt-2">
                            {profile.user.is_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <X className="w-3 h-3 mr-1" />
                                Inativa
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </TabsContent>

            {/* Phones Tab */}
            <TabsContent value="phones">
              <PhoneManagement />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Segurança da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alterar senha</p>
                        <p className="text-sm text-gray-500">Mantenha sua conta segura com uma senha forte</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                      >
                        {showPasswordForm ? 'Cancelar' : 'Alterar'}
                      </Button>
                    </div>

                    {showPasswordForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 border-t pt-4"
                      >
                        <div>
                          <Label htmlFor="current-password">Senha atual</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordForm.current_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                              placeholder="Digite sua senha atual"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="new-password">Nova senha</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                              placeholder="Digite a nova senha"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirm_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                              placeholder="Confirme a nova senha"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button onClick={handleChangePassword} className="w-full">
                          Alterar Senha
                        </Button>
                      </motion.div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Verificação de email</p>
                        <p className="text-sm text-gray-500">
                          Status: {profile.user.email_verified ? 'Verificado' : 'Não verificado'}
                        </p>
                      </div>
                      {profile.user.email_verified ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Button variant="outline" onClick={handleVerifyEmail}>
                          Verificar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Plan Tab */}
            <TabsContent value="plan">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
                      <Crown className="w-5 h-5 mr-2 text-blue-600" />
                      Seu Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.plan ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{profile.plan.nome}</h3>
                            <p className="text-blue-600 dark:text-blue-300 font-semibold">
                              {userApi.formatCurrency(profile.plan.valor_mensal)}/mês
                            </p>
                            {profile.last_payment && (
                              <p className="text-sm text-blue-500 dark:text-blue-400 mt-2">
                                Último pagamento: {userApi.formatCurrency(profile.last_payment.value)} em{' '}
                                {profile.last_payment.date ? userApi.formatDate(profile.last_payment.date) : 'Data não informada'}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        </div>

                        <div className="border-t border-blue-200 dark:border-blue-700 pt-6">
                          <div className="text-center">
                            {(() => {
                              // Verifica se é o plano mais caro
                              const isHighestPlan = availablePlans.length === 0 ||
                                !availablePlans.some(plan => plan.valor_mensal > (profile.plan?.valor_mensal || 0));

                              if (isHighestPlan) {
                                return (
                                  <>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                      Você já tem o melhor plano! 🎉
                                    </h4>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                      Você já está aproveitando todos os recursos premium disponíveis
                                    </p>
                                    <Button
                                      disabled
                                      variant="outline"
                                      className="text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    >
                                      <Crown className="w-4 h-4 mr-2" />
                                      Plano Premium Ativo
                                    </Button>
                                  </>
                                );
                              }

                              return (
                                <>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Quer mais recursos?
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Faça upgrade para um plano superior e tenha acesso a recursos avançados
                                  </p>
                                  <Button
                                    className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
                                    onClick={() => {
                                      // Implementaremos o checkout mais tarde
                                      console.log('Redirect to checkout');
                                    }}
                                  >
                                    <Crown className="w-4 h-4 mr-2" />
                                    Fazer Upgrade
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Crown className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum plano ativo</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Escolha um plano para começar a usar todos os recursos</p>
                        <Button
                          className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                          onClick={() => {
                            // Implementaremos o checkout mais tarde
                            console.log('Redirect to checkout');
                          }}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Escolher Plano
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}