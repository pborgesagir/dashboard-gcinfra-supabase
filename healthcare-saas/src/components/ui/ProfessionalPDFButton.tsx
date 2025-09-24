'use client'

import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { PictureAsPdf, Business, Analytics } from '@mui/icons-material';
import { exportProfessionalPDF, testCompletePDF } from '../../lib/professionalPDFExporterFinal';

interface ProfessionalPDFButtonProps {
  title?: string;
  companyName?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function ProfessionalPDFButton({
  title = 'Dashboard de Manutenção',
  companyName,
  filters,
  dateRange
}: ProfessionalPDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // Todos os gráficos solicitados pelo usuário
  const allChartIds = [
    'kpi-metrics',
    'maintenance-chart',
    'heatmap-chart',
    'work-order-trend',
    'response-time-trend',        // Tendência do Tempo Médio de Primeira Resposta
    'taxa-cumprimento-chart',     // Taxa Mensal de Cumprimento de OS Planejadas
    'causa-chart',                // Top 10 Ordens de Serviço por Causa
    'familia-chart',              // Top 10 Ordens de Serviço por Família
    'tipo-manutencao-chart',      // Top 10 Ordens de Serviço por Tipo de Manutenção
    'setor-chart',                // Top 10 Ordens de Serviço por Setor
    'equipment-count-chart',      // Top 10 Equipamentos por Quantidade de OS
    'distribuicao-prioridade-chart' // Distribuição por Prioridade
  ];

  const handleProfessionalExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.log('🎯 Iniciando exportação profissional completa...');

      // Filtros automáticos se não fornecidos
      const autoFilters = filters || {
        periodo: 'Últimos 12 meses',
        status: 'Todos os status',
        empresa: companyName || 'Todas as empresas'
      };

      // Range de datas automático se não fornecido
      const autoDateRange = dateRange || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 ano atrás
        end: new Date()
      };

      await exportProfessionalPDF({
        title,
        subtitle: 'Relatório Completo de Infraestrutura',
        companyName: companyName || 'Sistema GCINFRA 360º',
        dateRange: autoDateRange,
        filters: autoFilters,
        elementIds: allChartIds,
        filename: `GCINFRA_360_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`
      });

      console.log('✅ Exportação profissional concluída!');

    } catch (error) {
      console.error('❌ Erro na exportação profissional:', error);
      alert('❌ Erro ao gerar relatório. Veja o console para detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTestComplete = () => {
    console.log('🧪 Executando teste completo...');
    testCompletePDF();
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      p={3}
      border="2px solid #1976d2"
      borderRadius={3}
      bgcolor="rgba(25, 118, 210, 0.02)"
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Business color="primary" />
        <Typography variant="h6" color="primary" fontWeight="bold">
          Relatório Profissional GCINFRA 360º
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Gera um relatório completo com cabeçalho, logo, filtros aplicados, rodapé, data de exportação e todos os gráficos solicitados:
      </Typography>

      <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
        <li>✅ Tendência do Tempo Médio de Primeira Resposta</li>
        <li>✅ Taxa Mensal de Cumprimento de OS Planejadas</li>
        <li>✅ Top 10 Ordens de Serviço por Causa</li>
        <li>✅ Top 10 Ordens de Serviço por Família</li>
        <li>✅ Top 10 Ordens de Serviço por Tipo de Manutenção</li>
        <li>✅ Top 10 Ordens de Serviço por Setor</li>
        <li>✅ Top 10 Equipamentos por Quantidade de OS</li>
        <li>✅ Distribuição por Prioridade</li>
        <li>✅ KPIs, Manutenção, Heatmap, Tendências</li>
      </Box>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleProfessionalExport}
          disabled={isExporting}
          startIcon={<PictureAsPdf />}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            flex: 1,
            py: 1.5
          }}
        >
          {isExporting ? 'Gerando Relatório...' : 'Gerar Relatório Profissional'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleTestComplete}
          startIcon={<Analytics />}
          sx={{
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' }
          }}
        >
          Teste Completo
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" textAlign="center">
        <strong>Inclui:</strong> Cabeçalho com logo • Filtros aplicados • Data de exportação • Rodapé profissional • Numeração de páginas
      </Typography>
    </Box>
  );
}

// Função de teste standalone para console
export function testProfessionalPDFNow() {
  console.log('🧪 TESTE RÁPIDO - RELATÓRIO PROFISSIONAL');

  // Encontrar elementos na página atual
  const availableCharts = [
    'kpi-metrics', 'maintenance-chart', 'heatmap-chart', 'work-order-trend',
    'response-time-trend', 'taxa-cumprimento-chart', 'causa-chart', 'familia-chart',
    'tipo-manutencao-chart', 'setor-chart', 'equipment-count-chart', 'distribuicao-prioridade-chart'
  ].filter(id => document.getElementById(id));

  console.log(`📊 Gráficos encontrados: ${availableCharts.length}`);
  console.log(`📋 IDs: ${availableCharts.join(', ')}`);

  if (availableCharts.length === 0) {
    alert('❌ Nenhum gráfico encontrado na página atual!');
    return;
  }

  // Filtros de teste
  const testFilters = {
    empresa: 'Hospital de Teste',
    periodo: 'Últimos 12 meses',
    setor: 'Todos os setores',
    prioridade: 'Todas as prioridades'
  };

  exportProfessionalPDF({
    title: 'Dashboard de Manutenção',
    subtitle: 'Relatório de Teste Completo',
    companyName: 'Hospital de Teste',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: testFilters,
    elementIds: availableCharts,
    filename: `Teste_GCINFRA_360_${new Date().toISOString().split('T')[0]}.pdf`
  }).then(() => {
    console.log('✅ Teste profissional concluído!');
  }).catch(error => {
    console.error('❌ Teste falhou:', error);
  });
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as any).testProfessionalPDFNow = testProfessionalPDFNow;
}