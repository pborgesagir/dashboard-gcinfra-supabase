'use client'

import React from 'react';
import {
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  PictureAsPdf,
  AutoAwesome,
  Science,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { exportModernPDF, testModernPDF } from '../../lib/modernPDFExporter';

interface ModernPDFButtonProps {
  title?: string;
  companyName?: string;
  filters?: Record<string, unknown>;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function ModernPDFButton({
  title = 'Dashboard de Manutenção',
  companyName,
  filters,
  dateRange
}: ModernPDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [detectionStatus, setDetectionStatus] = React.useState<{
    available: number;
    missing: number;
    details: string[];
  } | null>(null);

  // IDs dos elementos que devem ser capturados
  const chartIds = React.useMemo(() => [
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
  ], []);

  // Detectar elementos disponíveis na inicialização
  React.useEffect(() => {
    const detectElements = () => {
      const available: string[] = [];
      const missing: string[] = [];

      chartIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            available.push(id);
          } else {
            missing.push(id);
          }
        } else {
          missing.push(id);
        }
      });

      setDetectionStatus({
        available: available.length,
        missing: missing.length,
        details: available
      });
    };

    // Detectar imediatamente e depois a cada 5 segundos
    detectElements();
    const interval = setInterval(detectElements, 5000);

    return () => clearInterval(interval);
  }, [chartIds]);

  const handleExport = async () => {
    if (isExporting || !detectionStatus || detectionStatus.available === 0) return;

    try {
      setIsExporting(true);

      console.log(`🎯 [EXPORTADOR MODERNO] Iniciando com ${detectionStatus.available} gráficos`);

      // Filtros automáticos se não fornecidos
      const autoFilters = filters || {
        periodo: 'Período selecionado no dashboard',
        empresa: companyName || 'Dados filtrados',
        status: 'Conforme filtros aplicados',
        observacao: 'Dados extraídos em tempo real'
      };

      // Range de datas automático se não fornecido
      const autoDateRange = dateRange || {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 ano atrás
        end: new Date()
      };

      await exportModernPDF({
        title,
        subtitle: 'Relatório Profissional com Design Moderno',
        companyName: companyName || 'GCINFRA 360º',
        dateRange: autoDateRange,
        filters: autoFilters,
        elementIds: detectionStatus.details,
        filename: `GCINFRA_360_Moderno_${new Date().toISOString().split('T')[0]}.pdf`
      });

    } catch (error) {
      console.error('❌ Erro na exportação moderna:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao gerar relatório moderno!\n\nDetalhes: ${errorMessage}\n\n🔍 Verifique:\n• Se os gráficos estão carregados\n• Se há dados para exibir\n• Console do navegador para mais detalhes`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTest = () => {
    console.log('🧪 [TESTE MODERNO] Executando teste...');
    testModernPDF();
  };

  const getStatusInfo = () => {
    if (!detectionStatus) return { color: 'info', icon: <Info />, text: 'Detectando...', severity: 'info' as const };

    if (detectionStatus.available === 0) {
      return {
        color: 'error',
        icon: <Warning />,
        text: 'Nenhum gráfico detectado',
        severity: 'error' as const
      };
    }

    if (detectionStatus.missing > 0) {
      return {
        color: 'warning',
        icon: <Warning />,
        text: `${detectionStatus.available} detectados, ${detectionStatus.missing} ausentes`,
        severity: 'warning' as const
      };
    }

    return {
      color: 'success',
      icon: <CheckCircle />,
      text: `Todos os ${detectionStatus.available} gráficos detectados`,
      severity: 'success' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(33, 150, 243, 0.06) 100%)',
        border: '2px solid #1976d2',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Padrão de fundo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 100,
          height: 100,
          background: 'linear-gradient(45deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
          borderRadius: '0 0 0 100px',
          zIndex: 0
        }}
      />

      {/* Conteúdo */}
      <Box position="relative" zIndex={1}>
        {/* Cabeçalho */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <AutoAwesome color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" color="primary" fontWeight="bold" sx={{ letterSpacing: 0.5 }}>
              Exportação PDF Moderna
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Design profissional • Captura otimizada • Layout responsivo
            </Typography>
          </Box>
          <Chip
            label="NOVA VERSÃO"
            size="small"
            color="success"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              color: 'white'
            }}
          />
        </Box>

        {/* Status de detecção */}
        <Alert
          severity={statusInfo.severity}
          icon={statusInfo.icon}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {statusInfo.text}
            </Typography>
            {detectionStatus && detectionStatus.available > 0 && (
              <Box mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={(detectionStatus.available / chartIds.length) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: statusInfo.color === 'success'
                        ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
                        : 'linear-gradient(90deg, #ff9800, #ffb74d)'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {detectionStatus.available}/{chartIds.length} elementos prontos para captura
                </Typography>
              </Box>
            )}
          </Box>
        </Alert>

        {/* Recursos */}
        <Box mb={3}>
          <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
            ✨ Melhorias Implementadas
          </Typography>

          <Box component="ul" sx={{ m: 0, pl: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
            <li><strong>🎨 Design Moderno:</strong> Cabeçalho com gradiente, ícones e tipografia aprimorada</li>
            <li><strong>📸 Logo Inteligente:</strong> Carregamento com múltiplas tentativas e fallback automático</li>
            <li><strong>📊 Captura Avançada:</strong> 3 estratégias diferentes para garantir qualidade</li>
            <li><strong>🎯 Layout Profissional:</strong> Seções organizadas, cores harmoniosas e espaçamento otimizado</li>
            <li><strong>📋 Filtros Estilizados:</strong> Apresentação organizada em colunas com destaque visual</li>
            <li><strong>📱 Interface Moderna:</strong> Progress bar animada e notificações elegantes</li>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Detalhes técnicos */}
        <Box
          sx={{
            bgcolor: 'rgba(25, 118, 210, 0.04)',
            p: 2,
            borderRadius: 2,
            border: '1px solid rgba(25, 118, 210, 0.1)',
            mb: 3
          }}
        >
          <Typography variant="body2" color="primary" fontWeight="bold" gutterBottom>
            🔧 Especificações Técnicas
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            • <strong>Resolução:</strong> Escala 3x para qualidade máxima<br/>
            • <strong>Formatos:</strong> PNG com compressão otimizada<br/>
            • <strong>Validação:</strong> Análise de conteúdo pixel por pixel<br/>
            • <strong>Fallbacks:</strong> 3 métodos de captura diferentes<br/>
            • <strong>Timeout:</strong> 15s por elemento com retry automático
          </Typography>
        </Box>

        {/* Botões de ação */}
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={isExporting || !detectionStatus || detectionStatus.available === 0}
            startIcon={isExporting ? undefined : <PictureAsPdf />}
            sx={{
              background: 'linear-gradient(135deg, #1976d2, #2196f3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
              },
              flex: 1,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: 2,
              transition: 'all 0.3s ease'
            }}
          >
            {isExporting ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Gerando PDF Moderno...
              </Box>
            ) : (
              'Gerar Relatório Moderno'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={isExporting}
            startIcon={<Science />}
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              borderWidth: 2,
              '&:hover': {
                borderColor: '#1565c0',
                bgcolor: 'rgba(25, 118, 210, 0.04)',
                borderWidth: 2,
                transform: 'translateY(-1px)'
              },
              fontWeight: 'bold',
              borderRadius: 2,
              transition: 'all 0.3s ease'
            }}
          >
            Teste
          </Button>
        </Box>

        {/* Rodapé */}
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          mt={3}
          sx={{ fontStyle: 'italic' }}
        >
          <strong>🚀 Versão 2.0:</strong> Design completamente reformulado • Captura robusta • Experiência premium
        </Typography>
      </Box>

      {/* Animações CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Paper>
  );
}

// Função para teste rápido via console
export function quickTestModern() {
  console.log('🧪 [TESTE RÁPIDO MODERNO] Iniciando...');
  testModernPDF();
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as unknown as { quickTestModern: typeof quickTestModern }).quickTestModern = quickTestModern;
}