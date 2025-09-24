import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportAdvancedOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  elementIds: string[];
  filename?: string;
  includeWatermark?: boolean;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export class AdvancedPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private colors: ThemeColors;

  constructor(theme: 'light' | 'dark' = 'light') {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;

    // Define colors based on theme (matching MUI theme)
    this.colors = theme === 'dark' ? {
      primary: '#90caf9',
      secondary: '#f48fb1',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b0b0b0'
    } : {
      primary: '#1976d2',
      secondary: '#dc004e',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666'
    };
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  private async addAdvancedHeader(title: string, subtitle?: string, branding?: PDFExportAdvancedOptions['customBranding']): Promise<void> {
    // Add background gradient effect
    this.addHeaderGradient();

    // Add company logo
    await this.addBrandingLogo(branding?.logoUrl);

    // Company name and main title
    const companyName = branding?.companyName || 'GCINFRA 360º';
    const [r, g, b] = this.hexToRgb(branding?.primaryColor || this.colors.primary);

    this.doc.setFontSize(24);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(companyName, this.margin + 35, 25);

    // Decorative elements
    this.addDecorativeElements(branding);

    // Report title
    this.doc.setFontSize(18);
    this.doc.setTextColor(...this.hexToRgb(this.colors.text));
    this.doc.text(title, this.margin, 47);

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(...this.hexToRgb(this.colors.textSecondary));
      this.doc.text(subtitle, this.margin, 57);
      this.currentY = 67;
    } else {
      this.currentY = 57;
    }
  }

  private addHeaderGradient(): void {
    // Create a subtle gradient effect using rectangles
    const steps = 10;
    const stepHeight = 40 / steps;

    for (let i = 0; i < steps; i++) {
      const opacity = 0.05 - (i * 0.005);
      const [r, g, b] = this.hexToRgb(this.colors.primary);

      this.doc.setFillColor(r, g, b);
      // Note: jsPDF doesn't support transparency directly, so we'll use a light version
      this.doc.setFillColor(Math.min(255, r + 200), Math.min(255, g + 200), Math.min(255, b + 200));
      this.doc.rect(0, i * stepHeight, this.pageWidth, stepHeight, 'F');
    }
  }

  private addDecorativeElements(branding?: PDFExportAdvancedOptions['customBranding']): void {
    const [primaryR, primaryG, primaryB] = this.hexToRgb(branding?.primaryColor || this.colors.primary);
    const [secondaryR, secondaryG, secondaryB] = this.hexToRgb(branding?.secondaryColor || this.colors.secondary);

    // Main decorative line
    this.doc.setDrawColor(primaryR, primaryG, primaryB);
    this.doc.setLineWidth(1.2);
    this.doc.line(this.margin, 30, this.pageWidth - this.margin, 30);

    // Secondary accent line
    this.doc.setDrawColor(secondaryR, secondaryG, secondaryB);
    this.doc.setLineWidth(0.4);
    this.doc.line(this.margin, 32, this.pageWidth - this.margin, 32);

    // Corner accents
    this.addCornerAccents(primaryR, primaryG, primaryB);
  }

  private addCornerAccents(r: number, g: number, b: number): void {
    this.doc.setFillColor(r, g, b);

    // Top right corner accent
    this.doc.triangle(this.pageWidth - 20, 5, this.pageWidth - 5, 5, this.pageWidth - 5, 20, 'F');

    // Top left corner accent (small)
    this.doc.rect(this.margin - 5, 5, 3, 15, 'F');
  }

  private async addBrandingLogo(logoUrl?: string): Promise<void> {
    const logo = logoUrl || '/logodaagir.png';

    try {
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
              const logoWidth = 30;
              const logoHeight = (img.height / img.width) * logoWidth;

              // Add white background circle for logo
              this.doc.setFillColor(255, 255, 255);
              this.doc.circle(this.margin + 15, 20, 18, 'F');

              // Add logo
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

        img.src = logo;
        setTimeout(resolve, 1500);
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }
  }

  private async captureElementWithRetry(elementId: string, maxRetries: number = 3): Promise<HTMLCanvasElement | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const element = document.getElementById(elementId);
        if (!element) {
          console.warn(`Element with ID "${elementId}" not found`);
          return null;
        }

        // Enhanced preparation for chart capture
        await this.prepareElementForCapture(element);

        const canvas = await html2canvas(element, {
          scale: 4, // Very high quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.scrollWidth,
          height: element.scrollHeight,
          foreignObjectRendering: true,
          imageTimeout: 15000,
          removeContainer: true,
          ignoreElements: (el) => {
            // Filter out problematic elements
            return el.classList.contains('recharts-tooltip-wrapper') ||
                   el.classList.contains('recharts-legend-wrapper') ||
                   el.tagName === 'IFRAME' ||
                   el.classList.contains('MuiBackdrop-root');
          },
          onclone: (clonedDoc, clonedElement) => {
            this.optimizeClonedElement(clonedDoc, clonedElement);
          }
        });

        return canvas;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for element ${elementId}:`, error);
        if (attempt === maxRetries) {
          console.error(`Final attempt failed for element ${elementId}:`, error);
          return null;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  }

  private async prepareElementForCapture(element: HTMLElement): Promise<void> {
    // Force layout recalculation
    element.offsetHeight;

    // Wait for animations
    await this.waitForAnimations(element);

    // Wait for charts and async content
    await this.waitForChartsAdvanced(element);

    // Force repaint
    await new Promise(resolve => requestAnimationFrame(() => resolve(void 0)));
  }

  private async waitForAnimations(element: HTMLElement): Promise<void> {
    const animations = element.getAnimations?.() || [];
    if (animations.length > 0) {
      try {
        await Promise.race([
          Promise.all(animations.map(anim => anim.finished)),
          new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
        ]);
      } catch {
        // Continue even if animations fail
      }
    }
  }

  private async waitForChartsAdvanced(element: HTMLElement): Promise<void> {
    // Wait for Recharts
    const svgElements = element.querySelectorAll('svg');
    await Promise.all(Array.from(svgElements).map(async (svg) => {
      if (!svg.querySelector('g, path, rect, circle')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }));

    // Wait for MUI charts
    const canvasElements = element.querySelectorAll('canvas');
    await Promise.all(Array.from(canvasElements).map(async (canvas) => {
      if (canvas.width === 0 || canvas.height === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }));

    // Final safety wait
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private optimizeClonedElement(clonedDoc: Document, clonedElement: HTMLElement): void {
    // Remove problematic elements from clone
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

    // Ensure all text is visible
    const textElements = clonedElement.querySelectorAll('text, tspan');
    textElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    });

    // Force SVG dimensions
    const svgs = clonedElement.querySelectorAll('svg');
    svgs.forEach(svg => {
      if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
        const rect = svg.getBoundingClientRect();
        svg.setAttribute('width', rect.width.toString());
        svg.setAttribute('height', rect.height.toString());
      }
    });
  }

  private addStyledImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const imgData = canvas.toDataURL('image/png', 0.95);
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = this.pageHeight - this.currentY - 50;

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Check if new page is needed
    if (this.currentY + imgHeight + 40 > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Add styled section header
    this.addStyledSectionHeader(elementId);

    // Center the image
    const xOffset = (maxWidth - imgWidth) / 2;

    // Add shadow effect
    this.addImageShadow(this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    // Add the image with border
    this.doc.setDrawColor(...this.hexToRgb(this.colors.primary));
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin + xOffset - 1, this.currentY - 1, imgWidth + 2, imgHeight + 2);

    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);
    this.currentY += imgHeight + 25;
  }

  private addStyledSectionHeader(elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);
    if (!sectionTitle) return;

    // Background for section
    const [r, g, b] = this.hexToRgb(this.colors.primary);
    this.doc.setFillColor(r + 230, g + 230, b + 230); // Very light primary color
    this.doc.rect(this.margin - 10, this.currentY - 12, this.pageWidth - (2 * this.margin) + 20, 20, 'F');

    // Title text
    this.doc.setFontSize(14);
    this.doc.setTextColor(r, g, b);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sectionTitle, this.margin, this.currentY);

    // Decorative line
    this.doc.setDrawColor(r, g, b);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, this.currentY + 4, this.margin + this.doc.getTextWidth(sectionTitle), this.currentY + 4);

    this.currentY += 20;
  }

  private addImageShadow(x: number, y: number, width: number, height: number): void {
    // Simple shadow effect
    const shadowOffset = 2;
    this.doc.setFillColor(200, 200, 200);
    this.doc.rect(x + shadowOffset, y + shadowOffset, width, height, 'F');
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores de Performance (KPIs)',
      'maintenance-chart': 'Análise de Manutenção',
      'heatmap-chart': 'Mapa de Calor - Padrão de Chamados',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Análise de Tempo de Resposta',
      'causa-chart': 'Distribuição por Causa',
      'familia-chart': 'Análise por Família de Equipamentos',
      'tipo-manutencao-chart': 'Tipos de Manutenção',
      'setor-chart': 'Distribuição por Setor',
      'taxa-cumprimento-chart': 'Taxa de Cumprimento Planejada',
      'equipment-count-chart': 'Contagem de Equipamentos',
      'company-status-gauges': 'Status Operacional das Empresas',
      'company-trend-chart': 'Tendências Corporativas',
      'mtbf-benchmarking-chart': 'Benchmarking MTBF'
    };
    return titles[elementId] || '';
  }

  private addWatermark(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      this.doc.setTextColor(200, 200, 200);
      this.doc.setFontSize(50);
      this.doc.setFont('helvetica', 'bold');

      // Rotate and add watermark
      this.doc.text('GCINFRA 360º', this.pageWidth / 2, this.pageHeight / 2, {
        angle: 45,
        align: 'center'
      });
    }
  }

  public async exportToPDF(options: PDFExportAdvancedOptions): Promise<void> {
    try {
      this.showAdvancedLoadingIndicator();

      // Add header with branding
      await this.addAdvancedHeader(options.title, options.subtitle, options.customBranding);

      // Add metadata info
      this.addMetadata(options);

      // Capture elements with progress tracking
      let successful = 0;
      const total = options.elementIds.length;

      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateAdvancedProgress(i, total, elementId);

        const canvas = await this.captureElementWithRetry(elementId);
        if (canvas) {
          this.addStyledImageToPDF(canvas, elementId);
          successful++;
        }
      }

      // Add watermark if requested
      if (options.includeWatermark) {
        this.addWatermark();
      }

      // Add enhanced footer
      this.addEnhancedFooter();

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${timestamp}.pdf`;

      this.hideAdvancedLoadingIndicator();
      this.doc.save(filename);

      this.showAdvancedSuccessMessage(successful, total);

    } catch (error) {
      this.hideAdvancedLoadingIndicator();
      console.error('Erro ao gerar PDF avançado:', error);
      throw new Error('Falha ao gerar o relatório PDF');
    }
  }

  private addMetadata(options: PDFExportAdvancedOptions): void {
    // Add generation info
    const now = new Date();
    const dateStr = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;

    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.hexToRgb(this.colors.textSecondary));
    this.doc.text(dateStr, this.pageWidth - this.margin - this.doc.getTextWidth(dateStr), 15);

    // Add period if provided
    if (options.dateRange) {
      const periodStr = `Período: ${options.dateRange.start.toLocaleDateString('pt-BR')} até ${options.dateRange.end.toLocaleDateString('pt-BR')}`;
      this.doc.setFontSize(11);
      this.doc.setTextColor(...this.hexToRgb(this.colors.text));
      this.doc.text(periodStr, this.margin, this.currentY);
      this.currentY += 12;
    }

    this.currentY += 10;
  }

  private addEnhancedFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Enhanced footer design
      const [r, g, b] = this.hexToRgb(this.colors.primary);

      // Footer background
      this.doc.setFillColor(r + 240, g + 240, b + 240);
      this.doc.rect(0, this.pageHeight - 25, this.pageWidth, 25, 'F');

      // Main footer line
      this.doc.setDrawColor(r, g, b);
      this.doc.setLineWidth(0.8);
      this.doc.line(this.margin, this.pageHeight - 22, this.pageWidth - this.margin, this.pageHeight - 22);

      // Company info
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('GCINFRA 360º - Plataforma de Gestão de Infraestrutura Hospitalar', this.margin, this.pageHeight - 14);

      // Page number
      const pageText = `${i} / ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 14);

      // Generation timestamp
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
      this.doc.setFontSize(7);
      this.doc.setTextColor(130, 130, 130);
      this.doc.text(timeStr, this.margin, this.pageHeight - 8);
    }
  }

  private showAdvancedLoadingIndicator(): void {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-advanced-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.9), rgba(220, 0, 78, 0.9));
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: Inter, sans-serif;
      backdrop-filter: blur(10px);
    `;

    overlay.innerHTML = `
      <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(20px);">
        <div style="width: 80px; height: 80px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: advancedSpin 1s linear infinite; margin: 0 auto 30px;"></div>
        <h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 600;">Gerando PDF Avançado</h2>
        <p id="pdf-advanced-progress" style="margin: 0; font-size: 16px; opacity: 0.9;">Preparando captura de alta qualidade...</p>
        <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 20px auto; overflow: hidden;">
          <div id="pdf-progress-bar" style="width: 0%; height: 100%; background: white; border-radius: 2px; transition: width 0.3s ease;"></div>
        </div>
      </div>
      <style>
        @keyframes advancedSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(overlay);
  }

  private updateAdvancedProgress(current: number, total: number, elementId: string): void {
    const progressElement = document.getElementById('pdf-advanced-progress');
    const progressBar = document.getElementById('pdf-progress-bar');

    if (progressElement && progressBar) {
      const sectionName = this.getSectionTitle(elementId) || elementId;
      const percentage = Math.round((current / total) * 100);

      progressElement.textContent = `Capturando: ${sectionName} (${current + 1}/${total})`;
      progressBar.style.width = `${percentage}%`;
    }
  }

  private hideAdvancedLoadingIndicator(): void {
    const overlay = document.getElementById('pdf-export-advanced-loading');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 300);
    }
  }

  private showAdvancedSuccessMessage(captured: number, total: number): void {
    const message = captured === total
      ? `PDF gerado com sucesso! Todas as ${captured} seções foram capturadas com alta qualidade.`
      : `PDF gerado com ${captured}/${total} seções capturadas.`;

    console.log(message);

    // Enhanced success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4caf50, #45a049);
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 20px; height: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">✓</div>
        <span>${message}</span>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Enhanced utility function
export async function exportDashboardToPDFAdvanced(options: PDFExportAdvancedOptions): Promise<void> {
  const exporter = new AdvancedPDFExporter();
  await exporter.exportToPDF(options);
}

// Theme-aware utility function
export async function exportWithTheme(
  options: PDFExportAdvancedOptions,
  theme: 'light' | 'dark' = 'light'
): Promise<void> {
  const exporter = new AdvancedPDFExporter(theme);
  await exporter.exportToPDF(options);
}