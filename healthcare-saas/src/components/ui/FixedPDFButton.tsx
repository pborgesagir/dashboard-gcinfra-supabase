'use client'

import React from 'react';
import { Button, Box, Typography, Paper, Chip } from '@mui/material';
import { PictureAsPdf, Engineering, Analytics } from '@mui/icons-material';
import { exportDashboardToPDF, testPDFExport } from '../../lib/pdfExporterFixed';

interface FixedPDFButtonProps {
  title?: string;
  companyName?: string;
  filters?: Record<string, unknown>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function FixedPDFButton({
  title = 'Dashboard de Manutenção',
  companyName,
  filters,
  dateRange
}: FixedPDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // IDs dos elementos que devem ser capturados
  const chartIds = [
    'kpi-metrics',                    // KPIs principais
    'maintenance-chart',              // Análise de manutenção
    'heatmap-chart',                  // Mapa de calor
    'work-order-trend',               // Tendência de OS
    'response-time-trend',            // Tempo de resposta
    'taxa-cumprimento-chart',         // Taxa cumprimento
    'causa-chart',                    // Top 10 por causa
    'familia-chart',                  // Top 10 por família
    'tipo-manutencao-chart',          // Top 10 por tipo
    'setor-chart',                    // Top 10 por setor
    'equipment-count-chart',          // Top 10 equipamentos
    'distribuicao-prioridade-chart'   // Distribuição prioridade
  ];

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Verificar quais elementos estão disponíveis
      const availableIds = chartIds.filter(id => document.getElementById(id));

      if (availableIds.length === 0) {
        alert('❌ Nenhum gráfico encontrado na página atual!\n\nCertifique-se de que os gráficos estão carregados antes de exportar.');
        return;
      }

      // Filtros automáticos se não fornecidos
      const autoFilters = filters || {
        periodo: 'Período selecionado',
        empresa: companyName || 'Todas as empresas',
        status: 'Dados filtrados'
      };

      // Range de datas automático se não fornecido
      const autoDateRange = dateRange || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 ano atrás
        end: new Date()
      };

      console.log(`🎯 Iniciando exportação com ${availableIds.length} gráficos`);

      await exportDashboardToPDF({
        title,
        subtitle: 'Relatório Completo de Infraestrutura',
        companyName: companyName || 'GCINFRA 360º',
        dateRange: autoDateRange,
        filters: autoFilters,
        elementIds: availableIds,
        filename: `GCINFRA_360_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`
      });

    } catch (error) {
      console.error('❌ Erro na exportação:', error);
      alert(`❌ Erro ao gerar relatório!\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique o console para mais informações.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTest = () => {
    console.log('🧪 Executando teste de exportação...');
    testPDFExport();
  };

  // Contar quantos gráficos estão disponíveis
  const availableCount = chartIds.filter(id => document.getElementById(id)).length;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        border: '2px solid #1976d2',
        borderRadius: 3,
        bgcolor: 'rgba(25, 118, 210, 0.02)'
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Engineering color="primary" />
        <Typography variant="h6" color="primary" fontWeight="bold">
          Exportação PDF Corrigida
        </Typography>
        <Chip
          label="CORRIGIDO"
          size="small"
          color="success"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Versão corrigida do exportador PDF que resolve os problemas de:
      </Typography>

      <Box component="ul" sx={{ m: 0, pl: 2, mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
        <li>✅ <strong>Logo da empresa</strong> - Carregamento otimizado</li>
        <li>✅ <strong>Captura de gráficos</strong> - Método melhorado para Recharts</li>
        <li>✅ <strong>Identificação de elementos</strong> - IDs corretos</li>
        <li>✅ <strong>Layout profissional</strong> - Cabeçalho, rodapé e formatação</li>
        <li>✅ <strong>Filtros aplicados</strong> - Exibição organizada dos filtros</li>
        <li>✅ <strong>Tratamento de erros</strong> - Feedback claro ao usuário</li>
      </Box>

      <Box
        display="flex"
        alignItems="center"
        gap={1}
        mb={3}
        p={2}
        bgcolor="rgba(25, 118, 210, 0.08)"
        borderRadius={2}
      >
        <Analytics color="primary" />
        <Typography variant="body2" color="primary" fontWeight="medium">
          {availableCount > 0
            ? `${availableCount} gráfico(s) detectado(s) na página atual`
            : 'Nenhum gráfico detectado - carregue o dashboard primeiro'
          }
        </Typography>
      </Box>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || availableCount === 0}
          startIcon={<PictureAsPdf />}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            flex: 1,
            py: 1.5
          }}
        >
          {isExporting ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleTest}
          disabled={isExporting}
          startIcon={<Analytics />}
          sx={{
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              bgcolor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Teste
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={2}>
        <strong>Recursos:</strong> Logo automática • Captura otimizada • Layout profissional • Tratamento de erros
      </Typography>
    </Paper>
  );
}

// Função para teste rápido via console
export function quickTest() {
  console.log('🧪 TESTE RÁPIDO - EXPORTAÇÃO PDF CORRIGIDA');
  testPDFExport();
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as unknown as { quickTestPDF: typeof quickTest }).quickTestPDF = quickTest;
}