import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Image,
  Share2,
  Settings,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Mail,
  Cloud,
  Zap
} from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  fileExtension: string;
  mimeType: string;
  features: string[];
  size: 'small' | 'medium' | 'large';
}

interface ExportJob {
  id: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  fileSize?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  settings: ExportSettings;
}

interface ExportSettings {
  dateRange: { start: string; end: string };
  includeTransactions: boolean;
  includeCategories: boolean;
  includeBudgets: boolean;
  includeGoals: boolean;
  includeCharts: boolean;
  includeAnalytics: boolean;
  format: 'detailed' | 'summary' | 'minimal';
  groupBy: 'day' | 'week' | 'month' | 'category';
  currency: 'BRL' | 'USD' | 'EUR';
  language: 'pt' | 'en' | 'es';
}

interface AdvancedDataExportWidgetProps {
  className?: string;
  dashboardData?: any;
}

export function AdvancedDataExportWidget({ className = '', dashboardData }: AdvancedDataExportWidgetProps) {
  const { user } = useAuth();
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeTransactions: true,
    includeCategories: true,
    includeBudgets: true,
    includeGoals: false,
    includeCharts: false,
    includeAnalytics: false,
    format: 'detailed',
    groupBy: 'day',
    currency: 'BRL',
    language: 'pt'
  });

  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Relatório completo em PDF com gráficos e análises',
      icon: FileText,
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      features: ['Gráficos', 'Tabelas', 'Análises', 'Formatação'],
      size: 'large'
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Planilha Excel com múltiplas abas e dados estruturados',
      icon: FileSpreadsheet,
      fileExtension: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      features: ['Múltiplas abas', 'Fórmulas', 'Gráficos', 'Filtros'],
      size: 'medium'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Dados brutos em formato CSV para análise personalizada',
      icon: File,
      fileExtension: 'csv',
      mimeType: 'text/csv',
      features: ['Dados brutos', 'Compatível', 'Leve', 'Importável'],
      size: 'small'
    },
    {
      id: 'json',
      name: 'JSON Export',
      description: 'Dados estruturados em formato JSON para desenvolvedores',
      icon: File,
      fileExtension: 'json',
      mimeType: 'application/json',
      features: ['Estruturado', 'API friendly', 'Completo', 'Programável'],
      size: 'small'
    },
    {
      id: 'png',
      name: 'Dashboard Image',
      description: 'Imagem do dashboard atual em alta resolução',
      icon: Image,
      fileExtension: 'png',
      mimeType: 'image/png',
      features: ['Visual', 'Compartilhável', 'Apresentações', 'Alta qualidade'],
      size: 'medium'
    }
  ];

  useEffect(() => {
    // Simulate some existing export jobs
    setExportJobs([
      {
        id: '1',
        format: exportFormats[0],
        status: 'completed',
        progress: 100,
        fileName: 'relatorio_financeiro_2024_03.pdf',
        fileSize: '2.4 MB',
        downloadUrl: '#',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        settings
      },
      {
        id: '2',
        format: exportFormats[1],
        status: 'failed',
        progress: 65,
        fileName: 'dados_financeiros_2024_03.xlsx',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        error: 'Dados insuficientes para o período selecionado',
        settings
      }
    ]);
  }, []);

  const startExport = async () => {
    if (!selectedFormat || !user?.id) return;

    setIsExporting(true);

    const newJob: ExportJob = {
      id: `export_${Date.now()}`,
      format: selectedFormat,
      status: 'pending',
      progress: 0,
      fileName: generateFileName(selectedFormat),
      createdAt: new Date().toISOString(),
      settings: { ...settings }
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export process
    simulateExportProcess(newJob.id);
    setIsExporting(false);
    setShowSettings(false);
  };

  const simulateExportProcess = async (jobId: string) => {
    const updateJob = (updates: Partial<ExportJob>) => {
      setExportJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ));
    };

    // Start processing
    updateJob({ status: 'processing', progress: 10 });

    // Simulate progress
    for (let progress = 10; progress <= 90; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateJob({ progress });
    }

    // Complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = Math.random() > 0.2; // 80% success rate

    if (success) {
      updateJob({
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
        downloadUrl: '#',
        fileSize: generateFileSize(selectedFormat?.size || 'medium')
      });
    } else {
      updateJob({
        status: 'failed',
        progress: 85,
        error: 'Erro interno do servidor. Tente novamente.'
      });
    }
  };

  const generateFileName = (format: ExportFormat): string => {
    const date = new Date().toISOString().split('T')[0];
    const formatName = settings.format;
    return `zapgastos_${formatName}_${date}.${format.fileExtension}`;
  };

  const generateFileSize = (size: 'small' | 'medium' | 'large'): string => {
    const sizes = {
      small: ['127 KB', '245 KB', '189 KB', '67 KB'],
      medium: ['1.2 MB', '2.1 MB', '3.4 MB', '2.8 MB'],
      large: ['4.2 MB', '6.7 MB', '5.1 MB', '8.3 MB']
    };
    const options = sizes[size];
    return options[Math.floor(Math.random() * options.length)];
  };

  const downloadFile = (job: ExportJob) => {
    // Simulate download
    console.log(`Downloading: ${job.fileName}`);

    // In a real app, this would trigger actual download
    const link = document.createElement('a');
    link.href = job.downloadUrl || '#';
    link.download = job.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Download iniciado: ${job.fileName}`);
  };

  const shareFile = (job: ExportJob) => {
    if (navigator.share) {
      navigator.share({
        title: 'Relatório Financeiro ZapGastos',
        text: `Confira meu relatório financeiro: ${job.fileName}`,
        url: job.downloadUrl
      });
    } else {
      navigator.clipboard.writeText(job.downloadUrl || '');
      alert('Link copiado para a área de transferência!');
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Loader2;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getFormatBadgeColor = (format: ExportFormat) => {
    switch (format.id) {
      case 'pdf': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'excel': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'csv': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'json': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'png': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Exportação Avançada
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Exporte seus dados em múltiplos formatos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          Selecionar Formato
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            const isSelected = selectedFormat?.id === format.id;

            return (
              <motion.div
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFormat(format)}
                className={`
                  p-4 rounded-2xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-900/20'
                    : 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-slate-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getFormatBadgeColor(format)}`}>
                    .{format.fileExtension}
                  </span>
                </div>

                <h5 className={`text-sm font-bold mb-1 ${
                  isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {format.name}
                </h5>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {format.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {format.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-white/50 dark:bg-slate-600/50 rounded-full text-gray-600 dark:text-gray-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50/50 dark:bg-slate-700/50 rounded-2xl"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
              ⚙️ Configurações de Exportação
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Período
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={settings.dateRange.start}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
                  />
                  <input
                    type="date"
                    value={settings.dateRange.end}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Content Options */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Incluir
                </label>
                <div className="space-y-1">
                  {[
                    { key: 'includeTransactions', label: 'Transações' },
                    { key: 'includeCategories', label: 'Categorias' },
                    { key: 'includeBudgets', label: 'Orçamentos' },
                    { key: 'includeGoals', label: 'Metas' },
                    { key: 'includeCharts', label: 'Gráficos' },
                    { key: 'includeAnalytics', label: 'Análises' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof ExportSettings] as boolean}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="w-3 h-3 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format Details */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Formato
                </label>
                <select
                  value={settings.format}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    format: e.target.value as 'detailed' | 'summary' | 'minimal'
                  }))}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="detailed">Detalhado</option>
                  <option value="summary">Resumo</option>
                  <option value="minimal">Minimalista</option>
                </select>
              </div>

              {/* Group By */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Agrupar por
                </label>
                <select
                  value={settings.groupBy}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    groupBy: e.target.value as 'day' | 'week' | 'month' | 'category'
                  }))}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="day">Dia</option>
                  <option value="week">Semana</option>
                  <option value="month">Mês</option>
                  <option value="category">Categoria</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={startExport}
                disabled={!selectedFormat || isExporting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Iniciar Exportação
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Jobs History */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
          📋 Histórico de Exportações
        </h4>

        {exportJobs.length === 0 ? (
          <div className="text-center py-8">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Nenhuma exportação realizada ainda
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-xs"
            >
              Criar primeira exportação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {exportJobs.map((job, index) => {
              const StatusIcon = getStatusIcon(job.status);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-4 bg-white/50 dark:bg-slate-600/50 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getFormatBadgeColor(job.format)}`}>
                        <job.format.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {job.fileName}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(job.createdAt)}
                          {job.fileSize && ` • ${job.fileSize}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(job.status)} ${
                        job.status === 'processing' ? 'animate-spin' : ''
                      }`} />
                      <span className={`text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status === 'completed' ? 'Concluído' :
                         job.status === 'processing' ? 'Processando' :
                         job.status === 'failed' ? 'Falhou' : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {job.progress}% concluído
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {job.status === 'failed' && job.error && (
                    <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {job.error}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {Object.entries(job.settings)
                        .filter(([key, value]) => typeof value === 'boolean' && value)
                        .slice(0, 3)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-400"
                          >
                            {key.replace('include', '').replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        ))}
                    </div>

                    <div className="flex items-center space-x-1">
                      {job.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(job)}
                            className="text-xs p-1 h-6"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareFile(job)}
                            className="text-xs p-1 h-6"
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}

                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFormat(job.format);
                            setSettings(job.settings);
                            setShowSettings(true);
                          }}
                          className="text-xs p-1 h-6"
                        >
                          <Loader2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {exportJobs.filter(j => j.status === 'completed').length} exportações concluídas
          </span>
          <span>
            Formatos: PDF, Excel, CSV, JSON, PNG
          </span>
        </div>
      </div>
    </motion.div>
  );
}