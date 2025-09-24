'use client'

import React from 'react';
import { Button, Box, Typography, Paper, Alert } from '@mui/material';
import { PictureAsPdf, BugReport } from '@mui/icons-material';
import { exportWorkingPDF, testWorkingPDF } from '../../lib/workingPDFExporter';

export default function WorkingPDFButton() {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.log('🔥 INICIANDO WORKING PDF...');

      // BUSCAR ELEMENTOS REAIS
      const allIds = [
        'kpi-metrics',
        'maintenance-chart',
        'heatmap-chart',
        'work-order-trend',
        'response-time-trend',
        'taxa-cumprimento-chart',
        'causa-chart',
        'familia-chart',
        'tipo-manutencao-chart',
        'setor-chart',
        'equipment-count-chart',
        'distribuicao-prioridade-chart'
      ];

      const foundIds: string[] = [];

      allIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            foundIds.push(id);
          }
        }
      });

      console.log(`📊 Elementos encontrados: ${foundIds.length}`);

      if (foundIds.length === 0) {
        alert('❌ NENHUM ELEMENTO ENCONTRADO!\n\nVerifique se o dashboard está carregado.');
        return;
      }

      await exportWorkingPDF({
        title: 'Dashboard GCINFRA 360º',
        elementIds: foundIds,
        filename: `GCINFRA_360_WORKING_${new Date().getTime()}.pdf`
      });

    } catch (error) {
      console.error('❌ Erro WORKING:', error);
      alert(`❌ ERRO: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTest = () => {
    console.log('🧪 TESTE WORKING...');
    testWorkingPDF();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        border: '3px solid #ff4444',
        borderRadius: 3,
        bgcolor: '#fff5f5'
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <BugReport sx={{ color: '#ff4444', fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: '#ff4444', fontWeight: 'bold' }}>
          WORKING PDF EXPORTER
        </Typography>
      </Box>

      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          🔥 VERSÃO QUE FUNCIONA DE VERDADE
        </Typography>
        <Typography variant="body2">
          Este exportador foi criado para gerar PDFs que realmente mudam:
        </Typography>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Cabeçalho azul vistoso</strong> com texto branco grande</li>
          <li><strong>Rodapé cinza</strong> com &quot;WORKING PDF EXPORTER&quot;</li>
          <li><strong>Múltiplas páginas</strong> se necessário</li>
          <li><strong>Logs detalhados</strong> no console</li>
          <li><strong>Progress overlay</strong> azul durante processo</li>
        </ul>
      </Alert>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting}
          startIcon={<PictureAsPdf />}
          sx={{
            bgcolor: '#ff4444',
            '&:hover': { bgcolor: '#dd3333' },
            flex: 1,
            py: 2,
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExporting ? '🔥 GERANDO WORKING PDF...' : '🔥 GERAR WORKING PDF'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleTest}
          disabled={isExporting}
          sx={{
            borderColor: '#ff4444',
            color: '#ff4444',
            borderWidth: 2,
            '&:hover': {
              borderColor: '#dd3333',
              bgcolor: '#fff5f5'
            },
            fontWeight: 'bold'
          }}
        >
          🧪 TESTE
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
        💡 <strong>Console:</strong> testWorkingPDF() | <strong>Diferença:</strong> Cabeçalho azul + rodapé cinza
      </Typography>
    </Paper>
  );
}