import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Bell, Save, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { UserSettings, UserSettingsUpdate, settingsApi } from '../../services/settingsApi';
import { toast } from 'sonner';

interface AlertasTabProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
  onReload: () => void;
}

export function AlertasTab({ settings, onSettingsUpdate, onReload }: AlertasTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    daily_reports_enabled: settings.daily_reports_enabled,
    daily_reports_time: settingsApi.formatTime(settings.daily_reports_time),
    commitment_alerts_enabled: settings.commitment_alerts_enabled,
    commitment_alerts_time: settingsApi.formatTime(settings.commitment_alerts_time),
  });

  const handleInputChange = (field: keyof typeof formData, value: boolean | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const updateData: UserSettingsUpdate = {
        daily_reports_enabled: formData.daily_reports_enabled,
        daily_reports_time: formData.daily_reports_time,
        commitment_alerts_enabled: formData.commitment_alerts_enabled,
        commitment_alerts_time: formData.commitment_alerts_time,
      };

      const updatedSettings = await settingsApi.updateUserSettings(updateData);
      onSettingsUpdate(updatedSettings);
      toast.success('Configurações de alertas salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form has been modified
  const hasChanges =
    formData.daily_reports_enabled !== settings.daily_reports_enabled ||
    formData.daily_reports_time !== settingsApi.formatTime(settings.daily_reports_time) ||
    formData.commitment_alerts_enabled !== settings.commitment_alerts_enabled ||
    formData.commitment_alerts_time !== settingsApi.formatTime(settings.commitment_alerts_time);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Daily Reports Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-600" />
              Relatórios Diários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Receber relatórios diários via WhatsApp
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Resumo diário das suas transações, gastos e orçamentos
                </p>
              </div>
              <Switch
                checked={formData.daily_reports_enabled}
                onCheckedChange={(checked) => handleInputChange('daily_reports_enabled', checked)}
              />
            </div>

            {formData.daily_reports_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="pl-6 border-l-2 border-blue-200 dark:border-blue-700 space-y-3"
              >
                <div>
                  <Label htmlFor="daily-reports-time" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Horário para receber
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <Input
                      id="daily-reports-time"
                      type="time"
                      value={formData.daily_reports_time}
                      onChange={(e) => handleInputChange('daily_reports_time', e.target.value)}
                      className="w-32 font-medium text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Commitment Alerts Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Alertas de Compromissos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Receber alertas de compromissos via WhatsApp
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lembretes dos seus compromissos e eventos agendados
                </p>
              </div>
              <Switch
                checked={formData.commitment_alerts_enabled}
                onCheckedChange={(checked) => handleInputChange('commitment_alerts_enabled', checked)}
              />
            </div>

            {formData.commitment_alerts_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="pl-6 border-l-2 border-green-200 dark:border-green-700 space-y-3"
              >
                <div>
                  <Label htmlFor="commitment-alerts-time" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Horário para receber
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <Input
                      id="commitment-alerts-time"
                      type="time"
                      value={formData.commitment_alerts_time}
                      onChange={(e) => handleInputChange('commitment_alerts_time', e.target.value)}
                      className="w-32 font-medium text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}