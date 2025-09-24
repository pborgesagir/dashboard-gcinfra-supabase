import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

export class PDFExporter {
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
    this.doc.text('GCINFRA 360º', this.margin + 35, 25); // Offset for logo space

    // Linha decorativa com gradiente visual
    this.doc.setDrawColor(25, 118, 210);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, 30, this.pageWidth - this.margin, 30);

    // Adicionar linha secundária mais fina
    this.doc.setDrawColor(144, 202, 249); // Light blue accent
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 32, this.pageWidth - this.margin, 32);

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
      // Try to load and add the company logo
      const logoPath = '/logodaagir.png';
      const img = new Image();

      return new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            // Create a canvas to convert the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);

              const logoData = canvas.toDataURL('image/png');

              // Add logo to PDF (small size in top-left)
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

        // Timeout fallback
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

    this.currentY += 10; // Espaço após filtros
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

  private async captureElement(elementId: string): Promise<HTMLCanvasElement | null> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with ID "${elementId}" not found`);
      return null;
    }

    try {
      // Wait for any animations/transitions to complete
      await this.waitForAnimations(element);

      // For Recharts components, ensure all SVGs are properly rendered
      await this.waitForCharts(element);

      // Enhanced options for better chart capture
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        foreignObjectRendering: true, // Better SVG rendering
        ignoreElements: (el) => {
          // Skip elements that might cause issues
          return el.classList.contains('recharts-tooltip-wrapper') ||
                 el.classList.contains('recharts-legend-wrapper');
        },
        onclone: (clonedDoc, clonedElement) => {
          // Ensure all styles are properly cloned
          this.ensureStylesInClone(clonedDoc, clonedElement);
        }
      });

      return canvas;
    } catch (error) {
      console.error(`Error capturing element "${elementId}":`, error);
      return null;
    }
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
        .catch(() => resolve()); // Continue even if animations fail
    });
  }

  private async waitForCharts(element: HTMLElement): Promise<void> {
    // Wait for Recharts to finish rendering
    const svgElements = element.querySelectorAll('svg');
    const promises = Array.from(svgElements).map(svg => {
      return new Promise<void>(resolve => {
        if (svg.querySelector('g')) {
          // SVG already has content
          resolve();
        } else {
          // Wait a bit for the chart to render
          setTimeout(resolve, 500);
        }
      });
    });

    await Promise.all(promises);

    // Additional wait for any async rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private ensureStylesInClone(clonedDoc: Document, clonedElement: HTMLElement): void {
    // Copy computed styles for better rendering
    const originalElement = document.getElementById(clonedElement.id);
    if (!originalElement) return;

    const allElements = clonedElement.querySelectorAll('*');
    const originalElements = originalElement.querySelectorAll('*');

    for (let i = 0; i < Math.min(allElements.length, originalElements.length); i++) {
      const clonedEl = allElements[i] as HTMLElement;
      const originalEl = originalElements[i] as HTMLElement;

      // Copy important style properties
      const computedStyle = window.getComputedStyle(originalEl);
      const importantProps = ['color', 'background-color', 'font-family', 'font-size', 'font-weight'];

      importantProps.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value) {
          clonedEl.style.setProperty(prop, value);
        }
      });
    }
  }

  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const imgData = canvas.toDataURL('image/png', 0.9); // Better quality
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = this.pageHeight - this.currentY - 40; // Leave space for footer

    // Calculate optimal dimensions
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If image is too tall, scale it down
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Verificar se a imagem cabe na página atual
    if (this.currentY + imgHeight + 30 > this.pageHeight - 30) { // More conservative spacing
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Adicionar título da seção com estilo melhorado
    const sectionTitle = this.getSectionTitle(elementId);
    if (sectionTitle) {
      // Background for section title
      this.doc.setFillColor(245, 245, 245);
      this.doc.rect(this.margin - 5, this.currentY - 8, this.pageWidth - (2 * this.margin) + 10, 15, 'F');

      // Section title text
      this.doc.setFontSize(12);
      this.doc.setTextColor(25, 118, 210); // Primary color
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);

      // Decorative line under title
      this.doc.setDrawColor(25, 118, 210);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.currentY + 3, this.margin + this.doc.getTextWidth(sectionTitle), this.currentY + 3);

      this.currentY += 15;
    }

    // Center the image if it's smaller than max width
    const xOffset = imgWidth < maxWidth ? (maxWidth - imgWidth) / 2 : 0;

    // Add border around image
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.2);
    this.doc.rect(this.margin + xOffset - 1, this.currentY - 1, imgWidth + 2, imgHeight + 2);

    // Add the image
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);
    this.currentY += imgHeight + 20; // More spacing after image
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

      // Linha decorativa superior no rodapé
      this.doc.setDrawColor(25, 118, 210); // Primary color
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20);

      // Linha secundária
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);

      // Texto do rodapé com estilo melhorado
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('GCINFRA 360º - Plataforma de Gestão de Infraestrutura Hospitalar', this.margin, this.pageHeight - 10);

      // Data e hora de geração no rodapé
      const now = new Date();
      const dateTimeStr = `Gerado em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
      this.doc.setFontSize(7);
      this.doc.setTextColor(130, 130, 130);
      this.doc.text(dateTimeStr, this.margin, this.pageHeight - 5);

      // Número da página com estilo melhorado
      const pageText = `Página ${i} de ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 10);
    }
  }

  public async exportToPDF(options: PDFExportOptions): Promise<void> {
    try {
      // Show loading indicator
      this.showLoadingIndicator();

      // Adicionar cabeçalho
      await this.addHeader(options.title, options.subtitle);

      // Adicionar data e filtros
      this.addDateAndFilters(options.dateRange, options.filters);

      // Capturar e adicionar cada elemento com melhor tratamento de erros
      let capturedElements = 0;
      const totalElements = options.elementIds.length;

      for (const elementId of options.elementIds) {
        try {
          this.updateLoadingProgress(capturedElements, totalElements, elementId);

          const canvas = await this.captureElement(elementId);
          if (canvas) {
            this.addImageToPDF(canvas, elementId);
            capturedElements++;
          } else {
            console.warn(`Failed to capture element: ${elementId}`);
          }
        } catch (error) {
          console.error(`Error processing element ${elementId}:`, error);
          // Continue with other elements
        }
      }

      // Adicionar rodapé
      this.addFooter();

      // Gerar nome do arquivo
      const filename = options.filename || `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Hide loading indicator
      this.hideLoadingIndicator();

      // Salvar o PDF
      this.doc.save(filename);

      // Show success message
      this.showSuccessMessage(capturedElements, totalElements);

    } catch (error) {
      this.hideLoadingIndicator();
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar o relatório PDF');
    }
  }

  private showLoadingIndicator(): void {
    // Create a loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: Inter, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #1976d2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h3 style="margin: 0 0 10px; font-size: 18px;">Gerando PDF...</h3>
        <p id="pdf-progress" style="margin: 0; font-size: 14px; opacity: 0.8;">Preparando exportação...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(overlay);
  }

  private updateLoadingProgress(current: number, total: number, elementId: string): void {
    const progressElement = document.getElementById('pdf-progress');
    if (progressElement) {
      const sectionName = this.getSectionTitle(elementId) || elementId;
      progressElement.textContent = `Capturando: ${sectionName} (${current + 1}/${total})`;
    }
  }

  private hideLoadingIndicator(): void {
    const overlay = document.getElementById('pdf-export-loading');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  private showSuccessMessage(captured: number, total: number): void {
    // Simple success notification
    const message = captured === total
      ? `PDF gerado com sucesso! ${captured} seções capturadas.`
      : `PDF gerado com ${captured}/${total} seções capturadas.`;

    console.log(message);

    // You could also show a toast notification here if available
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      (window as any).showNotification(message, 'success');
    }
  }
}

// Função utilitária para exportação rápida
export async function exportDashboardToPDF(options: PDFExportOptions): Promise<void> {
  const exporter = new PDFExporter();
  await exporter.exportToPDF(options);
}