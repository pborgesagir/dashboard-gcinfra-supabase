'use client'

import React from 'react';
import {
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import {
  PictureAsPdf,
  BugReport,
  Search,
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
  PlayArrow
} from '@mui/icons-material';
import { exportDebugPDF, testDebugPDF, DebugAndFixPDFExporter } from '../../lib/debugAndFixPDF';

interface DebugPDFButtonProps {
  title?: string;
  companyName?: string;
  filters?: Record<string, unknown>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function DebugPDFButtonFixed({
  title = 'Dashboard de Manutenção',
  companyName,
  filters,
  dateRange
}: DebugPDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResults, setScanResults] = React.useState<{
    found: string[];
    missing: string[];
    total: number;
  } | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  const handleScan = () => {
    console.log('🔍 Executando scan de elementos...');
    setIsScanning(true);

    try {
      const availableElements = DebugAndFixPDFExporter.scanAvailableElements();

      const allPossibleIds = [
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

      const missing = allPossibleIds.filter(id => !availableElements.includes(id));

      setScanResults({
        found: availableElements,
        missing,
        total: allPossibleIds.length
      });

      console.log(`✅ Scan concluído: ${availableElements.length}/${allPossibleIds.length} elementos`);
    } catch (error) {
      console.error('❌ Erro no scan:', error);
      alert('❌ Erro ao escanear elementos. Veja o console.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExport = async () => {
    if (isExporting || !scanResults || scanResults.found.length === 0) return;

    try {
      setIsExporting(true);

      console.log(`🎯 Exportando ${scanResults.found.length} elementos encontrados...`);

      const autoFilters = filters || {
        periodo: 'Dados do dashboard atual',
        empresa: companyName || 'Conforme seleção',
        observacao: 'Exportação de debug'
      };

      const autoDateRange = dateRange || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date()
      };

      await exportDebugPDF({
        title,
        subtitle: 'Relatório de Debug - Versão Corrigida',
        companyName: companyName || 'GCINFRA 360º',
        dateRange: autoDateRange,
        filters: autoFilters,
        elementIds: scanResults.found,
        filename: `GCINFRA_360_Debug_${new Date().toISOString().split('T')[0]}.pdf`
      });

    } catch (error) {
      console.error('❌ Erro na exportação:', error);
      alert(`❌ Erro ao gerar PDF!\n\nDetalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickTest = () => {
    console.log('🧪 Executando teste rápido...');
    testDebugPDF();
  };

  // Escanear automaticamente na inicialização
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleScan();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = () => {
    if (!scanResults) return 'info';
    if (scanResults.found.length === 0) return 'error';
    if (scanResults.found.length < scanResults.total) return 'warning';
    return 'success';
  };

  const getStatusMessage = () => {
    if (!scanResults) return 'Aguardando scan...';
    if (scanResults.found.length === 0) return 'Nenhum elemento encontrado';
    if (scanResults.found.length < scanResults.total) {
      return `${scanResults.found.length}/${scanResults.total} elementos encontrados`;
    }
    return `Todos os ${scanResults.found.length} elementos detectados`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        border: '2px solid #f44336',
        borderRadius: 3,
        bgcolor: 'rgba(244, 67, 54, 0.02)'
      }}
    >
      {/* Cabeçalho */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <BugReport color="error" />
        <Typography variant="h6" color="error" fontWeight="bold">
          PDF Debug & Fix
        </Typography>
        <Chip
          label="DEPURAÇÃO"
          size="small"
          color="error"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Versão de depuração que escaneia elementos, mostra logs detalhados e corrige problemas específicos.
      </Typography>

      {/* Status do Scan */}
      <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Typography variant="body2" fontWeight="medium">
            {getStatusMessage()}
          </Typography>
          <Button
            size="small"
            startIcon={<Search />}
            onClick={handleScan}
            disabled={isScanning}
            variant="outlined"
          >
            {isScanning ? 'Escaneando...' : 'Re-scan'}
          </Button>
        </Box>
      </Alert>

      {/* Detalhes do Scan */}
      {scanResults && (
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <IconButton
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <Typography variant="body2" fontWeight="medium">
              Detalhes do Scan ({scanResults.found.length + scanResults.missing.length} elementos verificados)
            </Typography>
          </Box>

          <Collapse in={showDetails}>
            <Box display="flex" gap={2}>
              {/* Elementos encontrados */}
              <Box flex={1}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  ✅ Encontrados ({scanResults.found.length})
                </Typography>
                <List dense>
                  {scanResults.found.map(id => (
                    <ListItem key={id} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={id}
                        primaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Elementos ausentes */}
              {scanResults.missing.length > 0 && (
                <Box flex={1}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    ❌ Ausentes ({scanResults.missing.length})
                  </Typography>
                  <List dense>
                    {scanResults.missing.map(id => (
                      <ListItem key={id} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Cancel color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={id}
                          primaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Recursos de Debug */}
      <Box mb={3}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          🔧 Recursos de Depuração:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
          <li><strong>Scan inteligente:</strong> Detecta elementos reais na página</li>
          <li><strong>Logs detalhados:</strong> Console mostra cada passo da captura</li>
          <li><strong>Validação rigorosa:</strong> Verifica dimensões e conteúdo</li>
          <li><strong>Cabeçalho forçado:</strong> Fundo azul garantido</li>
          <li><strong>Logo robusta:</strong> Fallback com gradiente</li>
          <li><strong>Rodapé fixo:</strong> Numeração e formatação consistente</li>
        </Box>
      </Box>

      {/* Botões de Ação */}
      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || !scanResults || scanResults.found.length === 0}
          startIcon={<PictureAsPdf />}
          sx={{
            bgcolor: '#f44336',
            '&:hover': { bgcolor: '#d32f2f' },
            flex: 1,
            py: 1.5
          }}
        >
          {isExporting ? 'Gerando PDF Debug...' : 'Gerar PDF Debug'}
        </Button>

        <Button
          variant="outlined"
          onClick={handleQuickTest}
          disabled={isExporting}
          startIcon={<PlayArrow />}
          sx={{
            borderColor: '#f44336',
            color: '#f44336',
            '&:hover': {
              borderColor: '#d32f2f',
              bgcolor: 'rgba(244, 67, 54, 0.04)'
            }
          }}
        >
          Teste Rápido
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={2}>
        <strong>Debug Mode:</strong> Logs no console • Scan automático • Captura forçada • Validação rigorosa
      </Typography>
    </Paper>
  );
}

// Funções para console
export function quickScan() {
  console.log('🔍 SCAN RÁPIDO DE ELEMENTOS');
  return DebugAndFixPDFExporter.scanAvailableElements();
}

export function quickDebugTest() {
  console.log('🧪 TESTE DEBUG RÁPIDO');
  testDebugPDF();
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as unknown as {
    quickScan: typeof quickScan;
    quickDebugTest: typeof quickDebugTest;
  }).quickScan = quickScan;
  (window as unknown as {
    quickScan: typeof quickScan;
    quickDebugTest: typeof quickDebugTest;
  }).quickDebugTest = quickDebugTest;
}