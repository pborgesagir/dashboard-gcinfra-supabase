'use client'

import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { BugReport, Analytics } from '@mui/icons-material';
import { exportDebugPDF, analyzePageElements } from '../../lib/debugPDFExporter';

export default function DebugPDFButton() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Análise da página atual
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    console.clear();
    console.log('🔍 INICIANDO ANÁLISE DA PÁGINA...');

    try {
      analyzePageElements();
      alert('✅ Análise concluída! Veja o console (F12) para detalhes dos elementos encontrados.');
    } catch (error) {
      console.error('❌ Erro na análise:', error);
      alert('❌ Erro na análise. Veja o console para detalhes.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Exportação debug com todos os elementos encontrados
  const handleDebugExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.clear();
      console.log('🚀 INICIANDO EXPORTAÇÃO DEBUG...');

      // Encontrar todos os elementos possíveis
      const allPossibleIds = [
        'kpi-metrics', 'maintenance-chart', 'heatmap-chart', 'work-order-trend',
        'response-time-trend', 'causa-chart', 'familia-chart', 'tipo-manutencao-chart',
        'setor-chart', 'taxa-cumprimento-chart', 'equipment-count-chart',
        'company-status-gauges', 'company-trend-chart', 'mtbf-benchmarking-chart'
      ];

      // Filtrar apenas os que existem na página
      const existingIds = allPossibleIds.filter(id => {
        const element = document.getElementById(id);
        return element !== null;
      });

      console.log(`📊 Elementos encontrados: ${existingIds.length}`);
      console.log(`📋 IDs: ${existingIds.join(', ')}`);

      if (existingIds.length === 0) {
        alert('❌ Nenhum elemento encontrado! Execute a análise primeiro.');
        return;
      }

      await exportDebugPDF({
        title: 'Debug Dashboard',
        subtitle: 'Análise Detalhada de Captura',
        elementIds: existingIds
      });

    } catch (error) {
      console.error('❌ Erro na exportação debug:', error);
      alert('❌ Erro na exportação. Veja o console para detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={1} p={2} border="2px dashed #1976d2" borderRadius={2}>
      <Typography variant="h6" color="primary" gutterBottom>
        🔍 Debug PDF Export
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={1}>
        Use estas ferramentas para descobrir por que apenas alguns gráficos são capturados:
      </Typography>

      <Box display="flex" gap={1}>
        <Button
          variant="outlined"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          startIcon={<Analytics />}
          size="small"
        >
          {isAnalyzing ? 'Analisando...' : '1. Analisar Página'}
        </Button>

        <Button
          variant="contained"
          onClick={handleDebugExport}
          disabled={isExporting}
          startIcon={<BugReport />}
          size="small"
          sx={{ bgcolor: '#f57c00', '&:hover': { bgcolor: '#e65100' } }}
        >
          {isExporting ? 'Exportando...' : '2. Export Debug'}
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary">
        1. Analise para ver quais elementos estão na página<br/>
        2. Export Debug mostra logs detalhados de cada tentativa de captura
      </Typography>
    </Box>
  );
}

// Função standalone para teste rápido no console
export function quickDebugTest() {
  console.clear();
  console.log('🧪 TESTE RÁPIDO DE DEBUG PDF');

  // Análise rápida
  analyzePageElements();

  // Buscar alguns elementos para teste
  const testIds = ['kpi-metrics', 'maintenance-chart', 'heatmap-chart'];
  const existingTestIds = testIds.filter(id => document.getElementById(id));

  if (existingTestIds.length === 0) {
    console.log('❌ Nenhum elemento de teste encontrado');
    return;
  }

  console.log(`🎯 Testando com: ${existingTestIds.join(', ')}`);

  // Exportar com debug
  exportDebugPDF({
    title: 'Teste Rápido',
    elementIds: existingTestIds
  }).then(() => {
    console.log('✅ Teste concluído! Veja os logs acima.');
  }).catch(error => {
    console.error('❌ Teste falhou:', error);
  });
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as any).quickDebugTest = quickDebugTest;
}