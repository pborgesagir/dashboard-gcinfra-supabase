'use client'

import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { exportSimplePDF } from '../../lib/simplePDFExporter';

interface SimplePDFButtonProps {
  title: string;
  subtitle?: string;
  elementIds: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function SimplePDFButton({
  title,
  subtitle,
  elementIds,
  dateRange,
  filters,
  disabled = false,
  size = 'medium'
}: SimplePDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      await exportSimplePDF({
        title,
        subtitle,
        elementIds,
        dateRange,
        filters
      });

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="contained"
      size={size}
      disabled={disabled || isExporting}
      onClick={handleExport}
      startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
      sx={{
        bgcolor: '#1976d2',
        '&:hover': {
          bgcolor: '#1565c0'
        },
        '&:disabled': {
          bgcolor: '#ccc'
        }
      }}
    >
      {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
    </Button>
  );
}

// Hook simplificado para uso direto
export function useSimplePDFExport() {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToPDF = React.useCallback(async ({
    title,
    subtitle,
    elementIds,
    dateRange,
    filters
  }: {
    title: string;
    subtitle?: string;
    elementIds: string[];
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
  }) => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      await exportSimplePDF({
        title,
        subtitle,
        elementIds,
        dateRange,
        filters
      });

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return {
    exportToPDF,
    isExporting
  };
}