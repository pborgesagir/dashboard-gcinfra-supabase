'use client'

import React from 'react';
import { Button, Box, Typography, Paper, Alert, Chip } from '@mui/material';
import { GetApp, Warning, CheckCircle } from '@mui/icons-material';
import { exportFallbackPDF, testFallbackPDF } from '../../lib/fallbackPDFExporter';

export default function FallbackPDFButton() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [elementsFound, setElementsFound] = React.useState<number>(0);

  // Verificar elementos disponíveis
  React.useEffect(() => {
    const checkElements = () => {
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

      const found = allIds.filter(id => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().width > 0;
      });

      setElementsFound(found.length);
    };

    checkElements();
    const interval = setInterval(checkElements, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.log('🚀 INICIANDO FALLBACK PDF...');

      // Buscar elementos disponíveis
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

      const foundIds = allIds.filter(id => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().width > 0;
      });

      console.log(`📊 Elementos encontrados: ${foundIds.length}`);

      if (foundIds.length === 0) {
        alert('❌ NENHUM ELEMENTO ENCONTRADO!\n\nVerifique se o dashboard está carregado.');
        return;
      }

      await exportFallbackPDF({
        title: 'Dashboard GCINFRA 360º',
        elementIds: foundIds,
        filename: `GCINFRA_360_FALLBACK_${new Date().getTime()}.pdf`
      });

    } catch (error) {
      console.error('❌ Erro Fallback:', error);
      alert(`❌ ERRO: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTest = () => {
    console.log('🧪 TESTE FALLBACK...');
    testFallbackPDF();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        border: '3px solid #ff9800',
        borderRadius: 3,
        bgcolor: '#fff8e1'
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <GetApp sx={{ color: '#ff9800', fontSize: 32 }} />
        <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
          FALLBACK PDF EXPORTER
        </Typography>
        <Chip
          label={`${elementsFound} elementos`}
          color={elementsFound > 0 ? 'success' : 'error'}
          size="small"
          icon={elementsFound > 0 ? <CheckCircle /> : <Warning />}
        />
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          🛡️ SOLUÇÃO ALTERNATIVA - SEMPRE FUNCIONA
        </Typography>
        <Typography variant="body2">
          Este exportador usa métodos alternativos quando jsPDF falha:
        </Typography>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Método 1:</strong> Geração via Print API (popup de impressão)</li>
          <li><strong>Método 2:</strong> Canvas para PNG e HTML para PDF</li>
          <li><strong>Método 3:</strong> Download HTML para conversão manual</li>
          <li><strong>Garantia:</strong> Pelo menos um método sempre funciona!</li>
        </ul>
      </Alert>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || elementsFound === 0}
          startIcon={<GetApp />}
          sx={{
            bgcolor: '#ff9800',
            '&:hover': { bgcolor: '#f57c00' },
            flex: 1,
            py: 2,
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExporting ? '🛡️ EXECUTANDO FALLBACK...' : '🛡️ EXPORT FALLBACK'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleTest}
          disabled={isExporting}
          sx={{
            borderColor: '#ff9800',
            color: '#ff9800',
            borderWidth: 2,
            '&:hover': {
              borderColor: '#f57c00',
              bgcolor: '#fff8e1'
            },
            fontWeight: 'bold'
          }}
        >
          🧪 TESTE
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
        💡 <strong>Console:</strong> testFallbackPDF() | <strong>Diferença:</strong> Múltiplos métodos de backup
      </Typography>

      {elementsFound === 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            ⚠️ NENHUM ELEMENTO DETECTADO
          </Typography>
          <Typography variant="body2">
            Aguarde o carregamento do dashboard ou verifique se os gráficos estão sendo renderizados.
          </Typography>
        </Alert>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          🎯 O QUE ESPERAR:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Método 1:</strong> Abre janela de impressão - use "Salvar como PDF"
          <br />
          • <strong>Método 2:</strong> Abre nova aba com HTML - use Ctrl+P
          <br />
          • <strong>Método 3:</strong> Baixa arquivo HTML - abra e imprima como PDF
          <br />
          • <strong>Visual:</strong> Cabeçalho laranja com "FALLBACK PDF EXPORTER"
        </Typography>
      </Box>
    </Paper>
  );
}