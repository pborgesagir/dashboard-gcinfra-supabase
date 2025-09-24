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
  companyName?: string;
  logoUrl?: string;
}

export class ProfessionalPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 15;
  private debug: string[] = [];
  private pageNumber: number = 1;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private log(message: string): void {
    console.log(message);
    this.debug.push(message);
  }

  // Cabeçalho profissional com logo
  private async addProfessionalHeader(options: ProfessionalPDFOptions): Promise<void> {
    // Logo (se fornecida)
    if (options.logoUrl) {
      try {
        // Usar logo padrão ou fornecida
        this.doc.addImage(options.logoUrl, 'PNG', this.margin, 10, 30, 15);
      } catch (error) {
        this.log(`⚠️ Logo não carregada: ${error}`);
      }
    }

    // Título principal
    this.doc.setFontSize(20);
    this.doc.setTextColor(25, 118, 210);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GCINFRA 360º', this.margin + 35, 18);

    // Subtítulo
    this.doc.setFontSize(14);
    this.doc.setTextColor(66, 66, 66);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Relatório de Dashboard de Manutenção', this.margin + 35, 25);

    // Linha separadora
    this.doc.setDrawColor(25, 118, 210);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 30, this.pageWidth - this.margin, 30);

    // Informações do relatório
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);

    // Data de exportação
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.doc.text(`Gerado em: ${dateStr}`, this.margin, 38);

    // Período dos dados
    if (options.dateRange) {
      const startStr = options.dateRange.start.toLocaleDateString('pt-BR');
      const endStr = options.dateRange.end.toLocaleDateString('pt-BR');
      this.doc.text(`Período: ${startStr} a ${endStr}`, this.margin + 60, 38);
    }

    // Empresa
    if (options.companyName) {
      this.doc.text(`Empresa: ${options.companyName}`, this.margin, 43);
    }

    this.currentY = 50;
  }

  // Seção de filtros ativos
  private addFiltersSection(filters?: Record<string, any>): void {
    if (!filters || Object.keys(filters).length === 0) return;

    this.doc.setFontSize(12);
    this.doc.setTextColor(25, 118, 210);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Filtros Aplicados:', this.margin, this.currentY);

    this.currentY += 8;

    this.doc.setFontSize(9);
    this.doc.setTextColor(66, 66, 66);
    this.doc.setFont('helvetica', 'normal');

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'todos') {
        const filterText = `• ${this.getFilterLabel(key)}: ${this.formatFilterValue(value)}`;
        this.doc.text(filterText, this.margin + 5, this.currentY);
        this.currentY += 4;
      }
    });

    this.currentY += 5;
  }

  private getFilterLabel(key: string): string {
    const labels: Record<string, string> = {
      'empresa': 'Empresa',
      'setor': 'Setor',
      'equipamento': 'Equipamento',
      'prioridade': 'Prioridade',
      'status': 'Status',
      'tipo_manutencao': 'Tipo de Manutenção',
      'periodo': 'Período',
      'responsavel': 'Responsável'
    };
    return labels[key] || key;
  }

  private formatFilterValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value.start && value.end) {
      return `${value.start} a ${value.end}`;
    }
    return String(value);
  }

  // Rodapé profissional
  private addProfessionalFooter(): void {
    const footerY = this.pageHeight - 15;

    // Linha separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Informações do rodapé
    this.doc.setFontSize(8);
    this.doc.setTextColor(120, 120, 120);
    this.doc.setFont('helvetica', 'normal');

    // Lado esquerdo - Sistema
    this.doc.text('GCINFRA 360º - Sistema de Gestão de Infraestrutura', this.margin, footerY);

    // Centro - Confidencial
    const centerText = 'Documento Confidencial';
    const centerX = (this.pageWidth - this.doc.getTextWidth(centerText)) / 2;
    this.doc.text(centerText, centerX, footerY);

    // Lado direito - Página
    const pageText = `Página ${this.pageNumber}`;
    const pageX = this.pageWidth - this.margin - this.doc.getTextWidth(pageText);
    this.doc.text(pageText, pageX, footerY);
  }

  // Captura otimizada baseada no que funcionou
  private async captureElementOptimized(elementId: string): Promise<HTMLCanvasElement | null> {
    this.log(`🎯 CAPTURANDO: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      this.log(`❌ Elemento não encontrado: ${elementId}`);
      return null;
    }

    // Análise do elemento
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      this.log(`❌ Elemento com dimensões zero: ${elementId}`);
      return null;
    }

    try {
      // Método otimizado baseado no feedback (Básico Otimizado que funcionou)
      this.log(`   🔄 Usando: Método Básico Otimizado`);

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc: Document) => {
          this.removeMUIProblematicElements(clonedDoc);
          this.optimizeForCleanBackground(clonedDoc);
        }
      });

      if (this.validateCanvas(canvas, elementId)) {
        this.log(`   ✅ SUCESSO: ${elementId}`);
        return canvas;
      } else {
        this.log(`   ❌ Canvas inválido: ${elementId}`);
        return null;
      }

    } catch (error) {
      this.log(`   💥 ERRO: ${elementId} - ${error}`);
      return null;
    }
  }

  // Remove elementos MUI problemáticos
  private removeMUIProblematicElements(doc: Document): void {
    const problematicSelectors = [
      '[class*="MuiSelect-nativeInput"]',
      '[class*="MuiBackdrop-root"]',
      '[class*="MuiModal-backdrop"]',
      '[class*="MuiButtonBase-root Mui-disabled"]',
      '[class*="MuiPickersInputBase-input"]',
      'input[aria-hidden="true"]'
    ];

    problematicSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        this.log(`   🧹 Removendo: ${el.className}`);
        el.remove();
      });
    });
  }

  // Otimiza para fundo limpo
  private optimizeForCleanBackground(doc: Document): void {
    // Remove fundos cinzas
    const containers = doc.querySelectorAll('div, section, article');
    containers.forEach(container => {
      const styles = window.getComputedStyle(container);
      const bgColor = styles.backgroundColor;

      if (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgb(128') ||
          bgColor.includes('grey') || bgColor.includes('gray')) {
        (container as HTMLElement).style.backgroundColor = 'transparent';
        this.log(`   🎨 Fundo limpo aplicado`);
      }
    });

    // Força fundo branco em gráficos
    const charts = doc.querySelectorAll('[class*="recharts"], [class*="chart"], svg');
    charts.forEach(el => {
      (el as HTMLElement).style.backgroundColor = '#ffffff';
    });

    // Remove sombras
    const elements = doc.querySelectorAll('*');
    elements.forEach(el => {
      (el as HTMLElement).style.boxShadow = 'none';
      (el as HTMLElement).style.filter = 'none';
    });
  }

  // Validação de canvas
  private validateCanvas(canvas: HTMLCanvasElement, elementId: string): boolean {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return false;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height));
      const data = imageData.data;

      let nonWhitePixels = 0;
      let totalPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        totalPixels++;
        if (a > 0 && (r < 240 || g < 240 || b < 240)) {
          nonWhitePixels++;
        }
      }

      const contentPercentage = (nonWhitePixels / totalPixels) * 100;
      this.log(`   📊 Conteúdo: ${contentPercentage.toFixed(1)}%`);

      return contentPercentage >= 1;

    } catch {
      return false;
    }
  }

  // Adiciona imagem com tamanhos otimizados
  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);
    const maxWidth = this.pageWidth - (2 * this.margin);

    // Alturas otimizadas por tipo
    const heightsByType: Record<string, number> = {
      'kpi-metrics': 50,
      'heatmap-chart': 80,
      'maintenance-chart': 70,
      'work-order-trend': 65,
      'response-time-trend': 65,
      'causa-chart': 60,
      'familia-chart': 60,
      'tipo-manutencao-chart': 60,
      'setor-chart': 60,
      'equipment-count-chart': 70,
      'company-status-gauges': 55,
      'company-trend-chart': 70,
      'mtbf-benchmarking-chart': 75,
      'taxa-cumprimento-chart': 65,
      'distribuicao-prioridade-chart': 60
    };

    const maxHeight = heightsByType[elementId] || 65;
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Nova página se necessário
    if (this.currentY + imgHeight + 25 > this.pageHeight - 25) {
      this.doc.addPage();
      this.pageNumber++;
      this.addProfessionalFooter();
      this.currentY = 20;
    }

    // Título do gráfico
    if (sectionTitle) {
      this.doc.setFontSize(11);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Adicionar imagem centralizada
    const xOffset = (maxWidth - imgWidth) / 2;
    const imgData = canvas.toDataURL('image/png', 0.9);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 10;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': 'Análise de Manutenção por Período',
      'heatmap-chart': 'Mapa de Calor - Atividades por Período',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Tendência do Tempo Médio de Primeira Resposta',
      'causa-chart': 'Top 10 Ordens de Serviço por Causa',
      'familia-chart': 'Top 10 Ordens de Serviço por Família',
      'tipo-manutencao-chart': 'Top 10 Ordens de Serviço por Tipo de Manutenção',
      'setor-chart': 'Top 10 Ordens de Serviço por Setor',
      'equipment-count-chart': 'Top 10 Equipamentos por Quantidade de OS',
      'taxa-cumprimento-chart': 'Taxa Mensal de Cumprimento de OS Planejadas',
      'distribuicao-prioridade-chart': 'Distribuição por Prioridade',
      'company-status-gauges': 'Status das Empresas',
      'company-trend-chart': 'Tendências Corporativas',
      'mtbf-benchmarking-chart': 'Benchmarking MTBF'
    };
    return titles[elementId] || elementId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Interface de progresso profissional
  private showProfessionalProgress(): void {
    const overlay = document.createElement('div');
    overlay.id = 'professional-pdf-progress';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.95), rgba(13, 71, 161, 0.95));
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 15px; backdrop-filter: blur(10px);">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">GCINFRA 360º</div>
        <div style="font-size: 16px; margin-bottom: 20px;">Gerando Relatório Profissional</div>
        <div id="progress-status" style="font-size: 14px; opacity: 0.9;">Preparando exportação...</div>
        <div style="margin-top: 20px;">
          <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background: white; transition: width 0.3s;"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateProgress(current: number, total: number, elementId: string): void {
    const progressEl = document.getElementById('progress-status');
    const barEl = document.getElementById('progress-bar');

    if (progressEl) {
      const title = this.getSectionTitle(elementId);
      progressEl.textContent = `Capturando: ${title} (${current}/${total})`;
    }

    if (barEl) {
      const percentage = (current / total) * 100;
      barEl.style.width = `${percentage}%`;
    }
  }

  private hideProgress(): void {
    const overlay = document.getElementById('professional-pdf-progress');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  // Método principal de exportação
  public async exportToPDF(options: ProfessionalPDFOptions): Promise<void> {
    this.log(`🚀 INICIANDO EXPORTAÇÃO PROFISSIONAL`);

    try {
      this.showProfessionalProgress();

      // Cabeçalho profissional
      await this.addProfessionalHeader(options);

      // Seção de filtros
      this.addFiltersSection(options.filters);

      let successCount = 0;
      const results: Array<{id: string, success: boolean}> = [];

      // Processar cada gráfico
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateProgress(i + 1, options.elementIds.length, elementId);

        const canvas = await this.captureElementOptimized(elementId);

        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          successCount++;
          results.push({id: elementId, success: true});
        } else {
          results.push({id: elementId, success: false});
        }
      }

      // Rodapé final
      this.addProfessionalFooter();

      // Salvar PDF
      const filename = options.filename || `GCINFRA_360_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;

      this.hideProgress();
      this.doc.save(filename);

      // Relatório final
      this.log(`\n📊 RELATÓRIO FINAL PROFISSIONAL:`);
      this.log(`✅ Gráficos capturados: ${successCount}/${options.elementIds.length}`);
      this.log(`📄 Páginas geradas: ${this.pageNumber}`);

      alert(`📊 Relatório Profissional Gerado!\n\n✅ ${successCount}/${options.elementIds.length} gráficos\n📄 ${this.pageNumber} páginas\n\nArquivo: ${filename}`);

    } catch (error) {
      this.hideProgress();
      this.log(`💥 ERRO: ${error}`);
      throw error;
    }
  }
}

// Função de exportação principal
export async function exportProfessionalPDF(options: ProfessionalPDFOptions): Promise<void> {
  const exporter = new ProfessionalPDFExporter();
  await exporter.exportToPDF(options);
}

// Função para teste rápido com todos os gráficos
export function testCompletePDF() {
  console.log('🧪 TESTE COMPLETO - RELATÓRIO PROFISSIONAL');

  // Todos os gráficos solicitados
  const allChartIds = [
    'kpi-metrics',
    'maintenance-chart',
    'heatmap-chart',
    'work-order-trend',
    'response-time-trend',
    'causa-chart',
    'familia-chart',
    'tipo-manutencao-chart',
    'setor-chart',
    'equipment-count-chart',
    'taxa-cumprimento-chart',
    'distribuicao-prioridade-chart'
  ];

  // Filtros exemplo
  const sampleFilters = {
    empresa: 'Hospital Exemplo',
    periodo: 'Últimos 12 meses',
    status: 'Todos'
  };

  exportProfessionalPDF({
    title: 'Dashboard de Manutenção',
    subtitle: 'Relatório Completo',
    companyName: 'Hospital Exemplo',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: sampleFilters,
    elementIds: allChartIds
  });
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as any).testCompletePDF = testCompletePDF;
  (window as any).exportProfessionalPDF = exportProfessionalPDF;
}