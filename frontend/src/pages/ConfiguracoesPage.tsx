import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Bell, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { UserSettings, settingsApi } from '../services/settingsApi';
import { toast } from 'sonner';
import { AlertasTab } from '../components/settings/AlertasTab';
import { SincronizacaoTab } from '../components/settings/SincronizacaoTab';

export function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await settingsApi.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async (updatedSettings: UserSettings) => {
    setSettings(updatedSettings);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">
                Configurações
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas preferências de notificações e integrações
              </p>
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
                <TabsTrigger value="alerts" className="min-w-fit">
                  <Bell className="w-4 h-4 mr-2" />
                  <span>Alertas</span>
                </TabsTrigger>
                <TabsTrigger value="sync" className="min-w-fit">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span>Sincronização</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Alerts Tab */}
            <TabsContent value="alerts">
              {settings && (
                <AlertasTab
                  settings={settings}
                  onSettingsUpdate={handleSettingsUpdate}
                  onReload={loadSettings}
                />
              )}
            </TabsContent>

            {/* Synchronization Tab */}
            <TabsContent value="sync">
              {settings && (
                <SincronizacaoTab
                  settings={settings}
                  onSettingsUpdate={handleSettingsUpdate}
                  onReload={loadSettings}
                />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
  );
}