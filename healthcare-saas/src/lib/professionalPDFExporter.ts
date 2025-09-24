import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProfessionalPDFOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  elementIds: string[];
  filename?: string;
  logoUrl?: string;
  companyName?: string;
}

interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  fontFamily: string;
}

interface LayoutConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  headerHeight: number;
  footerHeight: number;
  contentWidth: number;
  contentHeight: number;
}

export class ProfessionalPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private layout: LayoutConfig;
  private branding: BrandingConfig;
  private logoBase64: string | null = null;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');

    // Layout configuration for A4
    this.layout = {
      pageWidth: this.doc.internal.pageSize.width,
      pageHeight: this.doc.internal.pageSize.height,
      margin: 20,
      headerHeight: 40,
      footerHeight: 25,
      contentWidth: this.doc.internal.pageSize.width - 40, // 20mm margin on each side
      contentHeight: this.doc.internal.pageSize.height - 65 // Header + footer + margins
    };

    // Professional branding configuration matching MUI theme
    this.branding = {
      primaryColor: '#1976d2',      // Primary blue
      secondaryColor: '#dc004e',    // Secondary pink
      accentColor: '#2196f3',       // Light blue accent
      backgroundColor: '#f8f9fa',   // Light background
      textColor: '#212121',         // Dark text
      textSecondaryColor: '#666666', // Secondary text
      fontFamily: 'Inter, sans-serif'
    };
  }

  // Convert hex color to RGB array
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  // Load and prepare company logo
  private async loadCompanyLogo(logoUrl: string = '/logodaagir.png'): Promise<void> {
    try {
      const img = new Image();
      return new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // Set canvas size to logo size
              canvas.width = img.width;
              canvas.height = img.height;

              // Fill with white background for transparency handling
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Draw the logo
              ctx.drawImage(img, 0, 0);

              // Convert to base64
              this.logoBase64 = canvas.toDataURL('image/png', 0.9);
            }
          } catch (error) {
            console.warn('Could not process logo:', error);
          } finally {
            resolve();
          }
        };

        img.onerror = () => {
          console.warn('Logo not found, continuing without logo');
          resolve();
        };

        img.src = logoUrl;

        // Timeout fallback
        setTimeout(resolve, 2000);
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }
  }

  // Create professional document header
  private addProfessionalHeader(title: string, subtitle?: string): void {
    const [primaryR, primaryG, primaryB] = this.hexToRgb(this.branding.primaryColor);
    const [accentR, accentG, accentB] = this.hexToRgb(this.branding.accentColor);

    // Header background with gradient effect
    this.doc.setFillColor(245, 247, 250); // Very light blue-gray
    this.doc.rect(0, 0, this.layout.pageWidth, this.layout.headerHeight, 'F');

    // Top border stripe
    this.doc.setFillColor(primaryR, primaryG, primaryB);
    this.doc.rect(0, 0, this.layout.pageWidth, 3, 'F');

    // Company logo (left side)
    if (this.logoBase64) {
      try {
        const logoSize = 25;
        const logoY = 10;
        this.doc.addImage(this.logoBase64, 'PNG', this.layout.margin, logoY, logoSize, logoSize * 0.8);
      } catch (error) {
        console.warn('Error adding logo to header:', error);
      }
    }

    // Company name and title (center-left)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(primaryR, primaryG, primaryB);

    const companyX = this.logoBase64 ? this.layout.margin + 35 : this.layout.margin;
    this.doc.text('GCINFRA 360º', companyX, 20);

    // Subtitle with professional styling
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.hexToRgb(this.branding.textSecondaryColor));
    this.doc.text('Plataforma de Gestão de Infraestrutura Hospitalar', companyX, 28);

    // Report title (prominent)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(...this.hexToRgb(this.branding.textColor));
    this.doc.text(title, this.layout.margin, 38);

    // Decorative line under header
    this.doc.setDrawColor(accentR, accentG, accentB);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.layout.margin, this.layout.headerHeight - 2,
                  this.layout.pageWidth - this.layout.margin, this.layout.headerHeight - 2);

    // Update current Y position
    this.currentY = this.layout.headerHeight + 10;
  }

  // Enhanced metadata section
  private addEnhancedMetadataSection(options: ProfessionalPDFOptions): void {
    const [primaryR, primaryG, primaryB] = this.hexToRgb(this.branding.primaryColor);
    const [bgR, bgG, bgB] = this.hexToRgb('#f5f7fa');

    // Metadata background
    const metadataHeight = this.calculateMetadataHeight(options);
    this.doc.setFillColor(bgR, bgG, bgB);
    this.doc.rect(this.layout.margin - 5, this.currentY - 8,
                  this.layout.contentWidth + 10, metadataHeight, 'F');

    // Border
    this.doc.setDrawColor(primaryR, primaryG, primaryB);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.layout.margin - 5, this.currentY - 8,
                  this.layout.contentWidth + 10, metadataHeight);

    // Generation timestamp
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(primaryR, primaryG, primaryB);
    this.doc.text('📊 INFORMAÇÕES DO RELATÓRIO', this.layout.margin, this.currentY);

    this.currentY += 8;

    // Report details in organized layout
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.hexToRgb(this.branding.textColor));

    // Left column
    const leftCol = this.layout.margin + 5;
    const rightCol = this.layout.margin + (this.layout.contentWidth / 2);

    // Generation info
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Gerado em:', leftCol, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(timestamp, leftCol + 25, this.currentY);

    // Period info (if available)
    if (options.dateRange) {
      const periodStart = options.dateRange.start.toLocaleDateString('pt-BR');
      const periodEnd = options.dateRange.end.toLocaleDateString('pt-BR');

      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Período:', rightCol, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${periodStart} até ${periodEnd}`, rightCol + 20, this.currentY);
    }

    this.currentY += 8;

    // Filters section (if any)
    if (options.filters && this.hasActiveFilters(options.filters)) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(primaryR, primaryG, primaryB);
      this.doc.text('🔍 FILTROS APLICADOS:', leftCol, this.currentY);
      this.currentY += 6;

      const filterSummary = this.buildFilterSummary(options.filters);
      filterSummary.forEach((filter, index) => {
        if (index > 0 && index % 2 === 0) this.currentY += 5; // New line every 2 filters

        const column = index % 2 === 0 ? leftCol : rightCol;

        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(...this.hexToRgb(this.branding.textSecondaryColor));
        this.doc.text(`${filter.label}:`, column, this.currentY);

        this.doc.setFont('helvetica', 'normal');
        this.doc.text(filter.value, column + 25, this.currentY);
      });

      this.currentY += 6;
    }

    this.currentY += 10; // Space after metadata section
  }

  private calculateMetadataHeight(options: ProfessionalPDFOptions): number {
    let height = 20; // Base height

    if (options.filters && this.hasActiveFilters(options.filters)) {
      const filterCount = this.buildFilterSummary(options.filters).length;
      height += Math.ceil(filterCount / 2) * 5 + 15; // Account for filter rows
    }

    return height;
  }

  // Advanced chart capture with multiple fallback strategies
  private async captureChartElement(elementId: string): Promise<HTMLCanvasElement | null> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with ID "${elementId}" not found`);
      return null;
    }

    // Show capture indicator
    this.showCaptureIndicator(element, 'Preparando captura...');

    try {
      // Strategy 1: Wait for all content to be ready
      await this.ensureElementReady(element);

      // Strategy 2: Handle different chart types
      if (this.hasRechartsComponents(element)) {
        this.showCaptureIndicator(element, 'Processando gráficos Recharts...');
        return await this.captureRechartsElement(element);
      }

      if (this.hasSVGCharts(element)) {
        this.showCaptureIndicator(element, 'Convertendo elementos SVG...');
        return await this.captureSVGElement(element);
      }

      if (this.hasCanvasCharts(element)) {
        this.showCaptureIndicator(element, 'Capturando elementos Canvas...');
        return await this.captureCanvasElement(element);
      }

      // Strategy 3: Standard capture with optimized settings
      this.showCaptureIndicator(element, 'Finalizando captura...');
      return await this.standardCapture(element);

    } catch (error) {
      console.error(`Error capturing element "${elementId}":`, error);
      return null;
    } finally {
      this.hideCaptureIndicator(element);
    }
  }

  // Ensure element and all children are fully rendered
  private async ensureElementReady(element: HTMLElement): Promise<void> {
    // Wait for fonts to load
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Wait for images to load
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1000); // Timeout fallback
      });
    });
    await Promise.all(imagePromises);

    // Wait for any animations to complete
    const animations = element.getAnimations?.() || [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.all(animations.map(anim => anim.finished)),
        new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
      ]);
    }

    // Force layout recalculation
    element.offsetHeight;

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Specialized Recharts capture
  private async captureRechartsElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Force Recharts to re-render by triggering resize event
    window.dispatchEvent(new Event('resize'));
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clone element and prepare for capture
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    document.body.appendChild(clonedElement);

    try {
      // Wait for cloned element to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with specialized settings for Recharts
      const canvas = await html2canvas(clonedElement, {
        scale: 3, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (el) => {
          return el.classList.contains('recharts-tooltip-wrapper') ||
                 el.classList.contains('recharts-legend-wrapper');
        },
        onclone: (clonedDoc, clonedEl) => {
          // Ensure SVG elements have proper styling
          const svgs = clonedEl.querySelectorAll('svg');
          svgs.forEach(svg => {
            svg.style.backgroundColor = '#ffffff';
          });
        }
      });

      return canvas;
    } finally {
      document.body.removeChild(clonedElement);
    }
  }

  // SVG-specific capture method
  private async captureSVGElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: true,
      onclone: (clonedDoc, clonedElement) => {
        // Inline SVG styles
        const svgs = clonedElement.querySelectorAll('svg');
        svgs.forEach(svg => {
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', rect.width.toString());
          svg.setAttribute('height', rect.height.toString());
        });
      }
    });
  }

  // Canvas-specific capture method
  private async captureCanvasElement(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });
  }

  // Standard capture with optimized settings
  private async standardCapture(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });
  }

  // Chart type detection methods
  private hasRechartsComponents(element: HTMLElement): boolean {
    return !!(
      element.querySelector('.recharts-wrapper') ||
      element.querySelector('.recharts-surface') ||
      element.classList.contains('recharts-wrapper')
    );
  }

  private hasSVGCharts(element: HTMLElement): boolean {
    return !!element.querySelector('svg');
  }

  private hasCanvasCharts(element: HTMLElement): boolean {
    return !!element.querySelector('canvas');
  }

  // Visual feedback during capture
  private showCaptureIndicator(element: HTMLElement, message: string): void {
    const indicator = document.createElement('div');
    indicator.id = `capture-indicator-${element.id}`;
    indicator.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #1976d2, #2196f3);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
      animation: pulse 1.5s infinite;
    `;
    indicator.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    element.style.position = 'relative';
    element.appendChild(indicator);
  }

  private hideCaptureIndicator(element: HTMLElement): void {
    const indicator = document.getElementById(`capture-indicator-${element.id}`);
    if (indicator) {
      indicator.remove();
    }
  }

  // Professional chart layout in PDF
  private addChartToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const [primaryR, primaryG, primaryB] = this.hexToRgb(this.branding.primaryColor);

    // Calculate optimal dimensions for A4
    const maxWidth = this.layout.contentWidth;
    const maxHeight = Math.min(this.layout.contentHeight * 0.4, 120); // Max 40% of content height

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Adjust if too tall
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Check if new page needed
    if (this.currentY + imgHeight + 35 > this.layout.pageHeight - this.layout.footerHeight) {
      this.addNewPage();
    }

    // Section header with professional styling
    const sectionTitle = this.getSectionTitle(elementId);
    if (sectionTitle) {
      // Background for section header
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(this.layout.margin - 5, this.currentY - 5, this.layout.contentWidth + 10, 18, 'F');

      // Left border accent
      this.doc.setFillColor(primaryR, primaryG, primaryB);
      this.doc.rect(this.layout.margin - 5, this.currentY - 5, 3, 18, 'F');

      // Section title
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(primaryR, primaryG, primaryB);
      this.doc.text(sectionTitle, this.layout.margin + 5, this.currentY + 5);

      this.currentY += 20;
    }

    // Center the chart
    const xOffset = (this.layout.contentWidth - imgWidth) / 2;

    // Chart border with shadow effect
    this.doc.setFillColor(0, 0, 0, 0.1); // Shadow
    this.doc.rect(this.layout.margin + xOffset + 2, this.currentY + 2, imgWidth, imgHeight, 'F');

    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.layout.margin + xOffset, this.currentY, imgWidth, imgHeight);

    // Add the chart image
    const imgData = canvas.toDataURL('image/png', 0.9);
    this.doc.addImage(imgData, 'PNG', this.layout.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 20;
  }

  // Professional footer
  private addProfessionalFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    const [primaryR, primaryG, primaryB] = this.hexToRgb(this.branding.primaryColor);

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      const footerY = this.layout.pageHeight - this.layout.footerHeight + 5;

      // Footer background
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(0, footerY - 5, this.layout.pageWidth, this.layout.footerHeight, 'F');

      // Top border
      this.doc.setDrawColor(primaryR, primaryG, primaryB);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.layout.margin, footerY,
                    this.layout.pageWidth - this.layout.margin, footerY);

      // Company info (centered)
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(...this.hexToRgb(this.branding.textSecondaryColor));

      const companyText = 'GCINFRA 360º - Plataforma de Gestão de Infraestrutura Hospitalar';
      const companyTextWidth = this.doc.getTextWidth(companyText);
      const centerX = (this.layout.pageWidth - companyTextWidth) / 2;
      this.doc.text(companyText, centerX, footerY + 10);

      // Page number (right aligned)
      const pageText = `Página ${i} de ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(pageText, this.layout.pageWidth - this.layout.margin - pageTextWidth, footerY + 10);

      // Generation timestamp (left aligned)
      const now = new Date();
      const timestamp = `Gerado em ${now.toLocaleDateString('pt-BR')}`;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text(timestamp, this.layout.margin, footerY + 15);
    }
  }

  // Add new page with header
  private addNewPage(): void {
    this.doc.addPage();
    // Note: Header will be added in post-processing
    this.currentY = this.layout.headerHeight + 10;
  }

  // Helper methods
  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': '📊 Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': '📈 Análise de Manutenção por Período',
      'heatmap-chart': '🔥 Mapa de Calor - Padrão de Chamados',
      'work-order-trend': '📋 Tendência de Ordens de Serviço',
      'response-time-trend': '⏱️ Análise de Tempo de Resposta',
      'causa-chart': '🔍 Distribuição por Causa Raiz',
      'familia-chart': '🏥 Análise por Família de Equipamentos',
      'tipo-manutencao-chart': '🔧 Distribuição por Tipo de Manutenção',
      'setor-chart': '🏢 Análise por Setor Hospitalar',
      'taxa-cumprimento-chart': '✅ Taxa de Cumprimento de OS Planejadas',
      'equipment-count-chart': '📊 Inventário de Equipamentos por Empresa',
      'company-status-gauges': '⚡ Status Operacional das Empresas',
      'company-trend-chart': '📈 Tendências Corporativas Comparativas',
      'mtbf-benchmarking-chart': '🎯 Benchmarking MTBF - Análise Comparativa'
    };
    return titles[elementId] || '';
  }

  private hasActiveFilters(filters: Record<string, any>): boolean {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (value instanceof Date) return true;
      if (typeof value === 'string') return value !== '' && value !== 'todos';
      return value !== null && value !== undefined;
    });
  }

  private buildFilterSummary(filters: Record<string, any>): Array<{label: string, value: string}> {
    const summary: Array<{label: string, value: string}> = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      const label = this.getFilterLabel(key);
      const displayValue = this.formatFilterValue(value);

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
      tipomanutencao: 'Tipo Manutenção',
      situacao: 'Situação',
      possuiChamado: 'Possui Chamado'
    };
    return labels[key] || key;
  }

  private formatFilterValue(value: any): string {
    if (Array.isArray(value)) {
      return value.length > 2 ? `${value.slice(0, 2).join(', ')}... (+${value.length - 2})` : value.join(', ');
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    if (typeof value === 'string' && value !== 'todos') {
      return value;
    }
    return '';
  }

  // Main export method
  public async exportToPDF(options: ProfessionalPDFOptions): Promise<void> {
    try {
      // Show professional loading indicator
      this.showProfessionalLoading();

      // Load company logo
      await this.loadCompanyLogo(options.logoUrl);

      // Add professional header
      this.addProfessionalHeader(options.title, options.subtitle);

      // Add enhanced metadata section
      this.addEnhancedMetadataSection(options);

      // Capture and add all chart elements
      let successfulCaptures = 0;
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateLoadingProgress(i, options.elementIds.length, elementId);

        const canvas = await this.captureChartElement(elementId);
        if (canvas) {
          this.addChartToPDF(canvas, elementId);
          successfulCaptures++;
        }
      }

      // Add professional footer to all pages
      this.addProfessionalFooter();

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename ||
        `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${timestamp}.pdf`;

      // Hide loading and save
      this.hideProfessionalLoading();
      this.doc.save(filename);

      // Show success notification
      this.showSuccessNotification(successfulCaptures, options.elementIds.length, filename);

    } catch (error) {
      this.hideProfessionalLoading();
      console.error('Erro ao gerar PDF profissional:', error);
      throw new Error('Falha ao gerar o relatório PDF');
    }
  }

  // Professional loading indicator
  private showProfessionalLoading(): void {
    const overlay = document.createElement('div');
    overlay.id = 'professional-pdf-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.95), rgba(33, 150, 243, 0.95));
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Inter, sans-serif;
      backdrop-filter: blur(15px);
    `;

    overlay.innerHTML = `
      <div style="text-align: center; background: rgba(255,255,255,0.15); padding: 50px; border-radius: 20px; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);">
        <div style="font-size: 72px; margin-bottom: 25px;">📊</div>
        <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 700;">GCINFRA 360º</h1>
        <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 400; opacity: 0.9;">Gerando Relatório Profissional</h2>
        <p id="professional-pdf-progress" style="margin: 0; font-size: 16px; opacity: 0.8;">Preparando captura de alta qualidade...</p>
        <div style="width: 400px; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin: 25px auto; overflow: hidden;">
          <div id="professional-pdf-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #fff, #f0f9ff); border-radius: 4px; transition: width 0.4s ease; box-shadow: 0 0 10px rgba(255,255,255,0.5);"></div>
        </div>
        <p style="margin: 15px 0 0; font-size: 14px; opacity: 0.7;">Aguarde enquanto capturamos seus gráficos com qualidade profissional</p>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateLoadingProgress(current: number, total: number, elementId: string): void {
    const progressElement = document.getElementById('professional-pdf-progress');
    const progressBar = document.getElementById('professional-pdf-progress-bar');

    if (progressElement && progressBar) {
      const sectionName = this.getSectionTitle(elementId).replace(/^[📊📈🔥📋⏱️🔍🏥🔧🏢✅⚡🎯]\s*/, '');
      const percentage = Math.round(((current + 1) / total) * 100);

      progressElement.textContent = `Processando: ${sectionName} (${current + 1}/${total})`;
      progressBar.style.width = `${percentage}%`;
    }
  }

  private hideProfessionalLoading(): void {
    const overlay = document.getElementById('professional-pdf-loading');
    if (overlay) {
      overlay.style.transition = 'opacity 0.5s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 500);
    }
  }

  private showSuccessNotification(captured: number, total: number, filename: string): void {
    const message = captured === total
      ? `✅ Relatório gerado com sucesso!\n📄 Arquivo: ${filename}\n📊 ${captured} gráficos capturados com qualidade profissional`
      : `⚠️ Relatório gerado com ressalvas\n📄 Arquivo: ${filename}\n📊 ${captured}/${total} gráficos capturados`;

    console.log(message);

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 30px;
      right: 30px;
      background: ${captured === total ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : 'linear-gradient(135deg, #ff9800, #ffb74d)'};
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 10001;
      max-width: 400px;
      line-height: 1.4;
      animation: slideInRight 0.4s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    notification.innerHTML = message.replace(/\n/g, '<br>');
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideInRight 0.4s ease reverse';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 400);
      }
    }, 6000);
  }
}

// Export function for easy use
export async function exportProfessionalPDF(options: ProfessionalPDFOptions): Promise<void> {
  const exporter = new ProfessionalPDFExporter();
  await exporter.exportToPDF(options);
}