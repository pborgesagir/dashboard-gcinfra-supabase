import { useState, useCallback } from 'react';
import { exportDashboardToPDF, PDFExporter } from '../lib/pdfExport';
import { exportDashboardToPDFAdvanced, AdvancedPDFExporter, exportWithTheme } from '../lib/pdfExportAdvanced';
import { exportDashboardToPDFFixed } from '../lib/pdfExportFixed';
import { exportProfessionalPDF } from '../lib/professionalPDFExporter';
import { exportSimplePDF } from '../lib/simplePDFExporter';
import { exportDirectPDF } from '../lib/directPDFExporter';
import { exportDebugPDF } from '../lib/debugPDFExporter';
import { exportProfessionalPDF as exportProfessionalPDFComplete } from '../lib/professionalPDFExporterFinal';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  elementIds: string[];
  filename?: string;
  companyName?: string;
  logoUrl?: string;
}

interface AdvancedPDFExportOptions extends PDFExportOptions {
  includeWatermark?: boolean;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface ProfessionalPDFOptions extends PDFExportOptions {
  logoUrl?: string;
  companyName?: string;
}

interface PDFExportState {
  isExporting: boolean;
  progress: number;
  currentSection: string;
  error: string | null;
}

interface UsePDFExportOptions {
  title: string;
  subtitle?: string;
  elementIds: string[];
  getDateRange?: () => { start: Date; end: Date } | null;
  getFilters?: () => Record<string, any>;
}

export const usePDFExport = (legacyOptions?: UsePDFExportOptions) => {
  const [state, setState] = useState<PDFExportState>({
    isExporting: false,
    progress: 0,
    currentSection: '',
    error: null
  });

  const resetState = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      currentSection: '',
      error: null
    });
  }, []);

  const updateProgress = useCallback((progress: number, currentSection: string) => {
    setState(prev => ({
      ...prev,
      progress,
      currentSection
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isExporting: false
    }));
  }, []);

  // Legacy support for existing usage
  const legacyExportToPDF = useCallback(async () => {
    if (!legacyOptions) {
      throw new Error('Legacy options not provided');
    }

    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      const dateRange = legacyOptions.getDateRange?.() || null;
      const filters = legacyOptions.getFilters?.() || {};

      await exportProfessionalPDFComplete({
        title: legacyOptions.title,
        subtitle: legacyOptions.subtitle,
        dateRange: dateRange || undefined,
        filters,
        elementIds: legacyOptions.elementIds,
        companyName: 'GCINFRA 360º'
      });

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [legacyOptions, resetState, setError]);

  // New API that accepts options parameter
  const exportToPDFWithOptions = useCallback(async (options: PDFExportOptions): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      await exportProfessionalPDFComplete({
        ...options,
        companyName: options.companyName || 'GCINFRA 360º'
      });

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [resetState, setError]);

  // Professional PDF export (recommended)
  const exportToPDFProfessional = useCallback(async (options: ProfessionalPDFOptions): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      await exportProfessionalPDF(options);

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [resetState, setError]);

  // Complete Professional PDF export (final version with header, footer, filters)
  const exportToPDFComplete = useCallback(async (options: ProfessionalPDFOptions): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      await exportProfessionalPDFComplete(options);

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [resetState, setError]);


  // Advanced PDF export with enhanced features
  const exportToPDFAdvanced = useCallback(async (
    options: AdvancedPDFExportOptions,
    theme: 'light' | 'dark' = 'light'
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      await exportWithTheme(options, theme);

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [resetState, setError]);

  // Export with custom progress tracking
  const exportWithProgressTracking = useCallback(async (
    options: PDFExportOptions,
    onProgress?: (progress: number, section: string) => void
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      const exporter = new PDFExporter();

      // Override the capture method to track progress
      const originalCaptureElement = (exporter as any).captureElement;
      let completedElements = 0;
      const totalElements = options.elementIds.length;

      (exporter as any).captureElement = async function(elementId: string) {
        const sectionName = getSectionName(elementId);
        const progress = Math.round((completedElements / totalElements) * 100);

        updateProgress(progress, sectionName);
        onProgress?.(progress, sectionName);

        const result = await originalCaptureElement.call(this, elementId);
        completedElements++;

        return result;
      };

      await exporter.exportToPDF(options);

      updateProgress(100, 'Concluído');
      onProgress?.(100, 'Concluído');

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDF';
      setError(errorMessage);
      throw error;
    }
  }, [updateProgress, resetState, setError]);

  // Batch export multiple configurations
  const exportBatch = useCallback(async (
    configs: PDFExportOptions[],
    onBatchProgress?: (current: number, total: number, filename: string) => void
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }));

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const filename = config.filename || `Export_${i + 1}`;

        onBatchProgress?.(i, configs.length, filename);
        updateProgress(Math.round((i / configs.length) * 100), `Exportando: ${filename}`);

        await exportDirectPDF(config);

        // Small delay between exports to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      resetState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao exportar PDFs em lote';
      setError(errorMessage);
      throw error;
    }
  }, [updateProgress, resetState, setError]);

  // Export specific dashboard section
  const exportSection = useCallback(async (
    sectionId: string,
    title: string,
    options?: Partial<PDFExportOptions>
  ): Promise<void> => {
    const exportOptions: PDFExportOptions = {
      title: title,
      elementIds: [sectionId],
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      ...options
    };

    return exportToPDFWithOptions(exportOptions);
  }, [exportToPDFWithOptions]);

  // Quick export with default settings for current page
  const quickExport = useCallback(async (title: string): Promise<void> => {
    // Find all chart elements on the page
    const chartElements = Array.from(document.querySelectorAll('[id$="-chart"], [id$="-metrics"]'))
      .map(el => el.id)
      .filter(id => id);

    if (chartElements.length === 0) {
      throw new Error('Nenhum elemento de dashboard encontrado para exportar');
    }

    const options: PDFExportOptions = {
      title,
      elementIds: chartElements,
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    };

    return exportToPDFWithOptions(options);
  }, [exportToPDFWithOptions]);

  return {
    // State
    isExporting: state.isExporting,
    progress: state.progress,
    currentSection: state.currentSection,
    error: state.error,

    // Legacy support
    exportError: state.error,
    clearError: resetState,

    // Actions
    exportToPDF: legacyOptions ? legacyExportToPDF : exportToPDFWithOptions,
    exportToPDFProfessional,
    exportToPDFComplete,
    exportToPDFAdvanced,
    exportWithProgressTracking,
    exportBatch,
    exportSection,
    quickExport,
    resetState,

    // Utils
    getSectionName,
    getAvailableElements: () => {
      return Array.from(document.querySelectorAll('[id$="-chart"], [id$="-metrics"]'))
        .map(el => ({
          id: el.id,
          name: getSectionName(el.id)
        }))
        .filter(item => item.id);
    }
  };
};

// Helper function to get human-readable section names
function getSectionName(elementId: string): string {
  const names: Record<string, string> = {
    'kpi-metrics': 'Indicadores de Performance',
    'maintenance-chart': 'Gráfico de Manutenção',
    'heatmap-chart': 'Mapa de Calor',
    'work-order-trend': 'Tendência de OS',
    'response-time-trend': 'Tempo de Resposta',
    'causa-chart': 'Análise por Causa',
    'familia-chart': 'Análise por Família',
    'tipo-manutencao-chart': 'Tipos de Manutenção',
    'setor-chart': 'Análise por Setor',
    'taxa-cumprimento-chart': 'Taxa de Cumprimento',
    'equipment-count-chart': 'Contagem de Equipamentos',
    'company-status-gauges': 'Status das Empresas',
    'company-trend-chart': 'Tendências Corporativas',
    'mtbf-benchmarking-chart': 'Benchmarking MTBF'
  };

  return names[elementId] || elementId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default usePDFExport;