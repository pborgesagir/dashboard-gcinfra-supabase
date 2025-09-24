'use client'

import React from 'react';
import { Button } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { quickExportPDF } from '../../lib/directPDFExporter';

interface QuickPDFButtonProps {
  title: string;
  elementIds: string[];
  disabled?: boolean;
}

export default function QuickPDFButton({ title, elementIds, disabled }: QuickPDFButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleQuickExport = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      console.log(`🎯 Início da exportação: ${title}`);
      console.log(`📋 Elementos: ${elementIds.join(', ')}`);

      await quickExportPDF(title, elementIds);

      console.log('✅ Exportação concluída!');
    } catch (error) {
      console.error('❌ Erro na exportação:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleQuickExport}
      disabled={disabled || isExporting}
      startIcon={<PictureAsPdf />}
      sx={{
        bgcolor: '#1976d2',
        '&:hover': { bgcolor: '#1565c0' },
        '&:disabled': { bgcolor: '#ccc' }
      }}
    >
      {isExporting ? 'Gerando...' : 'PDF Rápido'}
    </Button>
  );
}

// Função standalone para teste rápido
export function testPDFExport() {
  console.log('🧪 Testando exportação PDF...');

  // Buscar todos os elementos com IDs de gráficos
  const chartElements = Array.from(document.querySelectorAll('[id$="-chart"], [id$="-metrics"], [id*="chart"], [id*="gauge"]'))
    .map(el => el.id)
    .filter(id => id);

  console.log(`📊 Elementos encontrados: ${chartElements.length}`);
  console.log(`📋 IDs: ${chartElements.join(', ')}`);

  if (chartElements.length === 0) {
    alert('❌ Nenhum gráfico encontrado! Verifique se os elementos têm IDs corretos.');
    return;
  }

  // Exportar imediatamente
  quickExportPDF('Teste Dashboard', chartElements.slice(0, 3)) // Apenas primeiros 3 para teste
    .then(() => {
      console.log('✅ Teste concluído!');
    })
    .catch((error) => {
      console.error('❌ Teste falhou:', error);
    });
}

// Para usar no console do navegador
if (typeof window !== 'undefined') {
  (window as any).testPDFExport = testPDFExport;
}