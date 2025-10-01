import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Link, Unlink, CheckCircle, AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { UserSettings, GoogleCalendarStatus, settingsApi } from '../../services/settingsApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SincronizacaoTabProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
  onReload: () => void;
}

export function SincronizacaoTab({ settings, onSettingsUpdate, onReload }: SincronizacaoTabProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadGoogleCalendarStatus();
    }
  }, [user?.id]);

  useEffect(() => {
    // Listen for OAuth completion messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-oauth-success') {
        loadGoogleCalendarStatus();
        onReload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user?.id]);

  const loadGoogleCalendarStatus = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingStatus(true);
      const status = await settingsApi.getGoogleCalendarStatus(user.id.toString());
      setGoogleStatus(status);
    } catch (error) {
      console.error('Erro ao carregar status do Google Calendar:', error);
      toast.error('Erro ao carregar status da sincronização');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setIsLoading(true);
      const result = await settingsApi.connectGoogleCalendar(user.id.toString());

      // Open Google OAuth in new window
      if (result.authorization_url) {
        const popup = window.open(result.authorization_url, '_blank', 'width=600,height=700');
        toast.success(result.message || 'Conecte sua conta Google na nova janela');

        // Poll to check if popup was closed
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            // Refresh status after popup closes
            setTimeout(() => {
              loadGoogleCalendarStatus();
              onReload();
            }, 1000);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Erro ao conectar Google Calendar:', error);
      const errorMessage = error.response?.data?.detail || 'Erro ao conectar com Google Calendar';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const result = await settingsApi.disconnectGoogleCalendar(user.id.toString());
      toast.success(result.message || 'Google Calendar desconectado');
      await loadGoogleCalendarStatus();
      onReload();
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
      toast.error('Erro ao desconectar Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const result = await settingsApi.syncGoogleCalendar(user.id.toString());
      toast.success(result.message || 'Sincronização iniciada');
      await loadGoogleCalendarStatus();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar com Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPreferenceChange = async (field: 'sync_transactions_enabled' | 'sync_commitments_enabled', value: boolean) => {
    try {
      setIsLoading(true);
      const updateData = { [field]: value };
      const updatedSettings = await settingsApi.updateUserSettings(updateData);
      onSettingsUpdate(updatedSettings);
      await loadGoogleCalendarStatus();
      toast.success('Preferência de sincronização atualizada');
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      toast.error('Erro ao atualizar preferência');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Carregando...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Google Calendar Integration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                {googleStatus?.connected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Status da Conexão
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {googleStatus?.connected ? (
                      <>Conectado como {googleStatus.email}</>
                    ) : (
                      'Não conectado'
                    )}
                  </p>
                </div>
              </div>
              <Badge
                variant={googleStatus?.connected ? 'default' : 'secondary'}
                className={googleStatus?.connected ? 'bg-green-100 text-green-800' : ''}
              >
                {googleStatus?.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>

            {/* Connection Controls */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Integração com Google Calendar
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sincronize seus compromissos e eventos automaticamente
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {googleStatus?.connected && googleStatus.last_sync && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última sincronização</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {settingsApi.formatLastSync(googleStatus.last_sync)}
                    </p>
                  </div>
                )}
                {googleStatus?.connected ? (
                  <Button
                    onClick={handleDisconnectGoogle}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4 mr-2" />
                    )}
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4 mr-2" />
                    )}
                    Conectar
                  </Button>
                )}
              </div>
            </div>

            {/* Sync Actions */}
            {googleStatus?.connected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <Button
                  onClick={handleSyncNow}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Agora
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Future Integrations Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gray-50/50 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 border-dashed">
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Mais Integrações em Breve
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estamos trabalhando em novas integrações para melhorar sua experiência
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}