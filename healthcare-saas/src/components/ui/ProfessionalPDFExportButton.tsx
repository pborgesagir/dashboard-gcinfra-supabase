'use client'

import React from 'react';
import { Button, Tooltip, CircularProgress, Box } from '@mui/material';
import { PictureAsPdf, Download, CheckCircle } from '@mui/icons-material';
import { usePDFExport } from '../../hooks/usePDFExport';

interface ProfessionalPDFExportButtonProps {
  title: string;
  subtitle?: string;
  elementIds: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function ProfessionalPDFExportButton({
  title,
  subtitle,
  elementIds,
  dateRange,
  filters,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  disabled = false
}: ProfessionalPDFExportButtonProps) {
  const {
    exportToPDFProfessional,
    isExporting,
    progress,
    currentSection,
    error
  } = usePDFExport();

  const handleExport = async () => {
    try {
      await exportToPDFProfessional({
        title,
        subtitle,
        elementIds,
        dateRange,
        filters,
        logoUrl: '/logodaagir.png',
        companyName: 'GCINFRA 360º'
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  };

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress
            size={20}
            thickness={4}
            sx={{ color: 'inherit' }}
          />
          <Box display="flex" flexDirection="column" alignItems="flex-start">
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Gerando PDF...
            </span>
            {currentSection && (
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {currentSection}
              </span>
            )}
          </Box>
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <span style={{ fontSize: '0.875rem' }}>Erro na exportação</span>
        </Box>
      );
    }

    return (
      <Box display="flex" alignItems="center" gap={1}>
        <PictureAsPdf />
        <span>Exportar PDF Profissional</span>
      </Box>
    );
  };

  const getTooltipTitle = () => {
    if (isExporting) {
      return `Gerando PDF profissional... ${progress}%`;
    }

    if (error) {
      return `Erro: ${error}`;
    }

    return 'Gerar relatório PDF com layout profissional, logo da empresa e captura otimizada de gráficos';
  };

  return (
    <Tooltip title={getTooltipTitle()} arrow>
      <Box display="inline-block">
        <Button
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          disabled={disabled || isExporting}
          onClick={handleExport}
          startIcon={isExporting ? null : <Download />}
          sx={{
            minWidth: 200,
            height: size === 'large' ? 56 : size === 'small' ? 32 : 40,
            background: variant === 'contained' ?
              'linear-gradient(135deg, #1976d2, #2196f3)' :
              undefined,
            '&:hover': {
              background: variant === 'contained' ?
                'linear-gradient(135deg, #1565c0, #1976d2)' :
                undefined,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            },
            transition: 'all 0.3s ease',
            ...(error && {
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              }
            })
          }}
        >
          {getButtonContent()}
        </Button>
      </Box>
    </Tooltip>
  );
}

// Hook personalizado para exportação rápida de dashboards específicos
export const useDashboardPDFExport = (dashboardType: 'clinical' | 'administrative' | 'benchmarking') => {
  const { exportToPDFProfessional, isExporting, progress, error } = usePDFExport();

  const exportDashboard = async (dateRange?: { start: Date; end: Date }, filters?: Record<string, any>) => {
    const dashboardConfigs = {
      clinical: {
        title: 'Dashboard Clínico',
        subtitle: 'Análise de Manutenção de Equipamentos Clínicos',
        elementIds: [
          'kpi-metrics',
          'maintenance-chart',
          'heatmap-chart',
          'causa-chart',
          'familia-chart',
          'tipo-manutencao-chart'
        ]
      },
      administrative: {
        title: 'Dashboard Administrativo',
        subtitle: 'Gestão Operacional e Indicadores de Performance',
        elementIds: [
          'kpi-metrics',
          'work-order-trend',
          'response-time-trend',
          'setor-chart',
          'taxa-cumprimento-chart'
        ]
      },
      benchmarking: {
        title: 'Dashboard de Benchmarking',
        subtitle: 'Análise Comparativa entre Empresas',
        elementIds: [
          'equipment-count-chart',
          'company-status-gauges',
          'company-trend-chart',
          'mtbf-benchmarking-chart'
        ]
      }
    };

    const config = dashboardConfigs[dashboardType];

    return exportToPDFProfessional({
      ...config,
      dateRange,
      filters,
      logoUrl: '/logodaagir.png',
      companyName: 'GCINFRA 360º'
    });
  };

  return {
    exportDashboard,
    isExporting,
    progress,
    error
  };
};

// Componente para exportação em lote
interface BatchPDFExportButtonProps {
  dashboards: Array<{
    type: 'clinical' | 'administrative' | 'benchmarking';
    title: string;
    elementIds: string[];
  }>;
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
}

export function BatchPDFExportButton({
  dashboards,
  dateRange,
  filters
}: BatchPDFExportButtonProps) {
  const { exportBatch, isExporting, progress } = usePDFExport();

  const handleBatchExport = async () => {
    const configs = dashboards.map(dashboard => ({
      title: dashboard.title,
      elementIds: dashboard.elementIds,
      dateRange,
      filters,
      filename: `GCINFRA_360_${dashboard.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    }));

    await exportBatch(configs);
  };

  return (
    <Button
      variant="outlined"
      onClick={handleBatchExport}
      disabled={isExporting}
      startIcon={isExporting ? <CircularProgress size={20} /> : <PictureAsPdf />}
      sx={{
        minWidth: 250,
        borderColor: '#1976d2',
        color: '#1976d2',
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
          borderColor: '#1565c0'
        }
      }}
    >
      {isExporting
        ? `Exportando em lote... ${progress}%`
        : `Exportar ${dashboards.length} Relatórios`
      }
    </Button>
  );
}