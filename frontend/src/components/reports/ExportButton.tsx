import { useState } from 'react';
import { Download, FileText, Table, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { reportsApi } from '../../services/reportsApi';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({ data, filename, disabled = false, className = '' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado disponível para exportação');
      return;
    }

    try {
      setIsExporting(true);

      // Transform data for better CSV format
      const transformedData = data.map(item => {
        const transformed: any = {};

        Object.keys(item).forEach(key => {
          let value = item[key];

          // Format dates
          if (key.includes('data') && value) {
            value = reportsApi.formatDate(value);
          }

          // Format currency values
          if ((key.includes('valor') || key.includes('limite') || key.includes('gasto')) && typeof value === 'number') {
            value = reportsApi.formatCurrency(value);
          }

          // Format percentages
          if (key.includes('percentual') && typeof value === 'number') {
            value = reportsApi.formatPercentage(value);
          }

          // Translate field names to Portuguese
          const translatedKey = translateFieldName(key);
          transformed[translatedKey] = value;
        });

        return transformed;
      });

      reportsApi.exportToCsv(transformedData, filename);
      toast.success(`Arquivo ${filename}.csv exportado com sucesso!`);

    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar arquivo CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado disponível para exportação');
      return;
    }

    try {
      setIsExporting(true);

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      toast.success(`Arquivo ${filename}.json exportado com sucesso!`);

    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      toast.error('Erro ao exportar arquivo JSON');
    } finally {
      setIsExporting(false);
    }
  };

  const translateFieldName = (fieldName: string): string => {
    const translations: { [key: string]: string } = {
      'id': 'ID',
      'data_transacao': 'Data da Transação',
      'descricao': 'Descrição',
      'valor': 'Valor',
      'tipo': 'Tipo',
      'categoria_id': 'ID da Categoria',
      'categoria_nome': 'Categoria',
      'nome': 'Nome',
      'valor_limite': 'Valor Limite',
      'valor_gasto': 'Valor Gasto',
      'percentual_gasto': 'Percentual Gasto',
      'status': 'Status',
      'periodicidade': 'Periodicidade',
      'dias_restantes': 'Dias Restantes',
      'ativo': 'Ativo',
      'total_valor': 'Total',
      'total_transacoes': 'Total de Transações',
      'total_receitas': 'Total de Receitas',
      'total_despesas': 'Total de Despesas',
      'saldo': 'Saldo',
    };

    return translations[fieldName] || fieldName;
  };

  if (disabled) {
    return (
      <Button variant="outline" disabled className={className}>
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting || !data || data.length === 0}
          className={`${className} ${isExporting ? 'opacity-50' : ''}`}
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleExportCsv}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <Table className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>CSV (Excel)</span>
            <span className="text-xs text-gray-500">Planilha para análise</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportJson}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>JSON</span>
            <span className="text-xs text-gray-500">Dados estruturados</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}