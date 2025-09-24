import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SVGToPNGConverter } from './svgToPng';

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
}

interface FilterSummary {
  label: string;
  value: string;
}

export class FixedPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private async addHeader(title: string, subtitle?: string): Promise<void> {
    // Add company logo if available
    await this.addLogo();

    // Logo e título principal
    this.doc.setFontSize(24);
    this.doc.setTextColor(25, 118, 210); // Primary blue from MUI theme
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GCINFRA 360º', this.margin + 35, 25);

    // Linha decorativa
    this.doc.setDrawColor(25, 118, 210);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, 30, this.pageWidth - this.margin, 30);

    // Título do relatório
    this.doc.setFontSize(18);
    this.doc.setTextColor(66, 66, 66);
    this.doc.text(title, this.margin, 47);

    // Subtítulo se fornecido
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, 57);
      this.currentY = 67;
    } else {
      this.currentY = 57;
    }
  }

  private async addLogo(): Promise<void> {
    try {
      const logoPath = '/logodaagir.png';
      const img = new Image();

      return new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);

              const logoData = canvas.toDataURL('image/png');
              const logoWidth = 25;
              const logoHeight = (img.height / img.width) * logoWidth;

              this.doc.addImage(logoData, 'PNG', this.margin, 10, logoWidth, logoHeight);
            }
          } catch (error) {
            console.warn('Could not add logo to PDF:', error);
          } finally {
            resolve();
          }
        };

        img.onerror = () => {
          console.warn('Logo not found, continuing without logo');
          resolve();
        };

        img.src = logoPath;
        setTimeout(resolve, 1000);
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }
  }

  private addDateAndFilters(dateRange?: { start: Date; end: Date }, filters?: Record<string, any>): void {
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);

    // Data de geração
    const now = new Date();
    const dateStr = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    this.doc.text(dateStr, this.pageWidth - this.margin - this.doc.getTextWidth(dateStr), 15);

    // Período dos dados
    if (dateRange) {
      const startStr = dateRange.start.toLocaleDateString('pt-BR');
      const endStr = dateRange.end.toLocaleDateString('pt-BR');
      const periodStr = `Período: ${startStr} até ${endStr}`;

      this.doc.setFontSize(11);
      this.doc.setTextColor(66, 66, 66);
      this.doc.text(periodStr, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Filtros aplicados
    if (filters && this.hasActiveFilters(filters)) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('Filtros aplicados:', this.margin, this.currentY);
      this.currentY += 8;

      const filterSummary = this.buildFilterSummary(filters);
      filterSummary.forEach(filter => {
        const filterText = `• ${filter.label}: ${filter.value}`;
        this.doc.text(filterText, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
    }

    this.currentY += 10;
  }

  private hasActiveFilters(filters: Record<string, any>): boolean {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return true;
      if (typeof value === 'string') return value !== '' && value !== 'todos';
      return value !== null && value !== undefined;
    });
  }

  private buildFilterSummary(filters: Record<string, any>): FilterSummary[] {
    const summary: FilterSummary[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      let label = this.getFilterLabel(key);
      let displayValue = this.formatFilterValue(value);

      if (displayValue) {
        summary.push({ label, value: displayValue });
      }
    });

    return summary;
  }

  private getFilterLabel(key: string): string {
    const labels: Record<string, string> = {
      empresa: 'Empresa',
      equipamento: 'Equipamento',
      familia: 'Família',
      prioridade: 'Prioridade',
      setor: 'Setor',
      oficina: 'Oficina',
      tipomanutencao: 'Tipo de Manutenção',
      situacao: 'Situação',
      possuiChamado: 'Possui Chamado',
      aberturaStartDate: 'Data Início Abertura',
      aberturaEndDate: 'Data Fim Abertura',
      fechamentoStartDate: 'Data Início Fechamento',
      fechamentoEndDate: 'Data Fim Fechamento'
    };
    return labels[key] || key;
  }

  private formatFilterValue(value: any): string {
    if (Array.isArray(value)) {
      return value.length > 3 ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3})` : value.join(', ');
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    if (typeof value === 'string' && value !== 'todos') {
      return value;
    }
    return '';
  }

  private async captureElementWithChartFix(elementId: string): Promise<HTMLCanvasElement | null> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with ID "${elementId}" not found`);
      return null;
    }

    try {
      // Show loading for this element
      this.showElementLoading(element);

      // Wait for any animations/transitions to complete
      await this.waitForAnimations(element);

      // Special handling for chart elements
      const hasCharts = this.hasChartElements(element);

      if (hasCharts) {
        console.log(`Detected charts in ${elementId}, using specialized capture`);

        // Method 1: Try SVG conversion first
        try {
          const canvas = await SVGToPNGConverter.convertElementWithSVGs(element);
          this.hideElementLoading(element);
          return canvas;
        } catch (svgError) {
          console.warn(`SVG conversion failed for ${elementId}, trying fallback:`, svgError);
        }

        // Method 2: Force render and try again
        try {
          await this.forceChartRerender(element);
          const canvas = await this.captureWithMultipleMethods(element);
          this.hideElementLoading(element);
          return canvas;
        } catch (fallbackError) {
          console.warn(`Fallback capture failed for ${elementId}:`, fallbackError);
        }
      }

      // Method 3: Standard html2canvas with enhanced options
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: false, // Disable for better compatibility
        imageTimeout: 10000,
        onclone: (clonedDoc, clonedElement) => {
          this.prepareClonedElement(clonedDoc, clonedElement);
        }
      });

      this.hideElementLoading(element);
      return canvas;

    } catch (error) {
      this.hideElementLoading(element);
      console.error(`Error capturing element "${elementId}":`, error);

      // Last resort: Try with minimal options
      try {
        return await html2canvas(element, {
          scale: 1,
          backgroundColor: '#ffffff',
          logging: false
        });
      } catch (finalError) {
        console.error(`Final capture attempt failed for "${elementId}":`, finalError);
        return null;
      }
    }
  }

  private hasChartElements(element: HTMLElement): boolean {
    return !!(
      element.querySelector('svg') ||
      element.querySelector('canvas') ||
      element.querySelector('.recharts-wrapper') ||
      element.querySelector('.recharts-surface') ||
      element.classList.contains('recharts-wrapper')
    );
  }

  private async forceChartRerender(element: HTMLElement): Promise<void> {
    // Force a rerender by briefly hiding and showing
    const originalDisplay = element.style.display;
    element.style.display = 'none';

    // Force layout recalculation
    element.offsetHeight;

    await new Promise(resolve => setTimeout(resolve, 100));

    element.style.display = originalDisplay;
    element.offsetHeight; // Force another layout

    // Wait for Recharts to re-render
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async captureWithMultipleMethods(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Try different html2canvas configurations
    const methods = [
      {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: true,
        logging: false
      },
      {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        logging: false
      },
      {
        scale: 1,
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      }
    ];

    for (const options of methods) {
      try {
        const canvas = await html2canvas(element, options);

        // Check if canvas is not blank
        if (this.isCanvasNotBlank(canvas)) {
          return canvas;
        }
      } catch (error) {
        console.warn('Capture method failed:', error);
      }
    }

    throw new Error('All capture methods failed');
  }

  private isCanvasNotBlank(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Check if there are non-white pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // If we find a non-white, non-transparent pixel, canvas is not blank
      if (a > 0 && (r < 250 || g < 250 || b < 250)) {
        return true;
      }
    }

    return false;
  }

  private showElementLoading(element: HTMLElement): void {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = `loading-${element.id}`;
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: Inter, sans-serif;
      font-size: 14px;
      color: #1976d2;
    `;
    loadingOverlay.innerHTML = '📊 Capturando gráfico...';

    const parent = element.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(loadingOverlay);
    }
  }

  private hideElementLoading(element: HTMLElement): void {
    const loadingOverlay = document.getElementById(`loading-${element.id}`);
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  private prepareClonedElement(clonedDoc: Document, clonedElement: HTMLElement): void {
    // Remove problematic elements
    const problematicSelectors = [
      '.recharts-tooltip-wrapper',
      '.MuiBackdrop-root',
      '.MuiModal-root',
      'script',
      'noscript'
    ];

    problematicSelectors.forEach(selector => {
      const elements = clonedElement.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Force visibility on text elements
    const textElements = clonedElement.querySelectorAll('text, tspan, .recharts-text');
    textElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.style.display = 'block';
    });

    // Ensure SVGs have proper dimensions
    const svgs = clonedElement.querySelectorAll('svg');
    svgs.forEach(svg => {
      const originalSvg = document.querySelector(`#${clonedElement.id} svg`);
      if (originalSvg) {
        const rect = originalSvg.getBoundingClientRect();
        svg.setAttribute('width', rect.width.toString());
        svg.setAttribute('height', rect.height.toString());
      }
    });
  }

  private async waitForAnimations(element: HTMLElement): Promise<void> {
    return new Promise(resolve => {
      const animations = element.getAnimations?.() || [];
      if (animations.length === 0) {
        resolve();
        return;
      }

      Promise.all(animations.map(anim => anim.finished))
        .then(() => resolve())
        .catch(() => resolve());
    });
  }

  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const imgData = canvas.toDataURL('image/png', 0.9);
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = this.pageHeight - this.currentY - 40;

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Check if new page needed
    if (this.currentY + imgHeight + 30 > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Add section title
    const sectionTitle = this.getSectionTitle(elementId);
    if (sectionTitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 15;
    }

    // Center the image
    const xOffset = (maxWidth - imgWidth) / 2;

    // Add border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.2);
    this.doc.rect(this.margin + xOffset - 1, this.currentY - 1, imgWidth + 2, imgHeight + 2);

    // Add the image
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);
    this.currentY += imgHeight + 20;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': 'Gráfico de Manutenção',
      'heatmap-chart': 'Mapa de Calor - Chamados por Setor',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Tendência de Tempo de Resposta',
      'causa-chart': 'Distribuição por Causa',
      'familia-chart': 'Distribuição por Família',
      'tipo-manutencao-chart': 'Distribuição por Tipo de Manutenção',
      'setor-chart': 'Distribuição por Setor',
      'taxa-cumprimento-chart': 'Taxa de Cumprimento Planejada',
      'equipment-count-chart': 'Contagem de Equipamentos por Empresa',
      'company-status-gauges': 'Status das Empresas',
      'company-trend-chart': 'Tendência das Empresas',
      'mtbf-benchmarking-chart': 'Benchmarking MTBF'
    };
    return titles[elementId] || '';
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Footer line
      this.doc.setDrawColor(25, 118, 210);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20);

      // Company text
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('GCINFRA 360º - Plataforma de Gestão de Infraestrutura Hospitalar', this.margin, this.pageHeight - 10);

      // Page number
      const pageText = `Página ${i} de ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 10);
    }
  }

  public async exportToPDF(options: PDFExportOptions): Promise<void> {
    try {
      // Show advanced loading
      this.showAdvancedLoading();

      // Add header
      await this.addHeader(options.title, options.subtitle);

      // Add date and filters
      this.addDateAndFilters(options.dateRange, options.filters);

      // Capture elements with chart fixes
      let successful = 0;
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateLoadingProgress(i, options.elementIds.length, elementId);

        const canvas = await this.captureElementWithChartFix(elementId);
        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          successful++;
        }
      }

      // Add footer
      this.addFooter();

      // Generate filename
      const filename = options.filename || `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      this.hideAdvancedLoading();

      // Save PDF
      this.doc.save(filename);

      this.showSuccessNotification(successful, options.elementIds.length);

    } catch (error) {
      this.hideAdvancedLoading();
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar o relatório PDF');
    }
  }

  private showAdvancedLoading(): void {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-fixed-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.95), rgba(220, 0, 78, 0.95));
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Inter, sans-serif;
      backdrop-filter: blur(10px);
    `;

    overlay.innerHTML = `
      <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px;">
        <div style="font-size: 60px; margin-bottom: 20px;">📊</div>
        <h2 style="margin: 0 0 15px; font-size: 24px;">Gerando PDF com Correção de Gráficos</h2>
        <p id="pdf-fixed-progress" style="margin: 0; font-size: 16px;">Preparando captura especializada...</p>
        <div style="width: 300px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 3px; margin: 20px auto;">
          <div id="pdf-fixed-progress-bar" style="width: 0%; height: 100%; background: white; border-radius: 3px; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateLoadingProgress(current: number, total: number, elementId: string): void {
    const progressElement = document.getElementById('pdf-fixed-progress');
    const progressBar = document.getElementById('pdf-fixed-progress-bar');

    if (progressElement && progressBar) {
      const sectionName = this.getSectionTitle(elementId) || elementId;
      const percentage = Math.round((current / total) * 100);

      progressElement.textContent = `Processando: ${sectionName} (${current + 1}/${total})`;
      progressBar.style.width = `${percentage}%`;
    }
  }

  private hideAdvancedLoading(): void {
    const overlay = document.getElementById('pdf-export-fixed-loading');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    }
  }

  private showSuccessNotification(captured: number, total: number): void {
    const message = captured === total
      ? `✅ PDF gerado com sucesso! Todos os ${captured} gráficos foram capturados.`
      : `⚠️ PDF gerado com ${captured}/${total} seções capturadas.`;

    console.log(message);

    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${captured === total ? '#4caf50' : '#ff9800'};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      max-width: 400px;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  }
}

// Enhanced export function that fixes chart rendering issues
export async function exportDashboardToPDFFixed(options: PDFExportOptions): Promise<void> {
  const exporter = new FixedPDFExporter();
  await exporter.exportToPDF(options);
}