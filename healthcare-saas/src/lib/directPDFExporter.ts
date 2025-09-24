import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DirectPDFOptions {
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

export class DirectPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 15;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  // Cabeçalho super simples
  private addHeader(title: string, subtitle?: string): void {
    this.doc.setFontSize(18);
    this.doc.setTextColor(25, 118, 210);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GCINFRA 360º', this.margin, 20);

    this.doc.setDrawColor(25, 118, 210);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25);

    this.doc.setFontSize(14);
    this.doc.setTextColor(66, 66, 66);
    this.doc.text(title, this.margin, 35);

    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, 42);
      this.currentY = 50;
    } else {
      this.currentY = 45;
    }

    // Data de geração
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    this.doc.setFontSize(8);
    this.doc.text(`Gerado em: ${dateStr}`, this.pageWidth - this.margin - 40, 15);

    this.currentY += 10;
  }

  // Captura DIRETA - sem esperas desnecessárias
  private async captureElementDirect(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`🎯 Capturando: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`❌ Elemento não encontrado: ${elementId}`);
      return null;
    }

    try {
      // Apenas força um layout refresh rápido
      element.offsetHeight;

      // Captura IMEDIATA com configuração simples
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Remove elementos problemáticos do clone
          const problematic = clonedDoc.querySelectorAll('.MuiBackdrop-root, .recharts-tooltip-wrapper');
          problematic.forEach(el => el.remove());
        }
      });

      if (canvas && canvas.width > 0 && canvas.height > 0) {
        console.log(`✅ Sucesso: ${elementId} (${canvas.width}x${canvas.height})`);
        return canvas;
      } else {
        console.warn(`⚠️ Canvas inválido: ${elementId}`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Erro em ${elementId}:`, error);
      return null;
    }
  }

  // Adicionar ao PDF de forma direta
  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);

    // Calcular tamanho
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 70; // Altura fixa menor

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Nova página se necessário
    if (this.currentY + imgHeight + 20 > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Título simples
    if (sectionTitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 7;
    }

    // Centralizar
    const xOffset = (maxWidth - imgWidth) / 2;

    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 0.7);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 10;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'KPIs',
      'maintenance-chart': 'Gráfico de Manutenção',
      'heatmap-chart': 'Mapa de Calor',
      'work-order-trend': 'Tendência de OS',
      'response-time-trend': 'Tempo de Resposta',
      'causa-chart': 'Por Causa',
      'familia-chart': 'Por Família',
      'tipo-manutencao-chart': 'Tipos de Manutenção',
      'setor-chart': 'Por Setor',
      'taxa-cumprimento-chart': 'Taxa de Cumprimento',
      'equipment-count-chart': 'Equipamentos',
      'company-status-gauges': 'Status das Empresas',
      'company-trend-chart': 'Tendências',
      'mtbf-benchmarking-chart': 'Benchmarking MTBF'
    };
    return titles[elementId] || elementId;
  }

  // Rodapé simples
  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      this.doc.setDrawColor(25, 118, 210);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('GCINFRA 360º', this.margin, this.pageHeight - 8);

      const pageText = `${i}/${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 8);
    }
  }

  // Loading super simples
  private showSimpleLoading(): void {
    const overlay = document.createElement('div');
    overlay.id = 'direct-pdf-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(25, 118, 210, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 40px; margin-bottom: 15px;">📄</div>
        <div>Gerando PDF...</div>
        <div id="direct-progress" style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Iniciando...</div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateSimpleProgress(message: string): void {
    const progressEl = document.getElementById('direct-progress');
    if (progressEl) {
      progressEl.textContent = message;
    }
  }

  private hideSimpleLoading(): void {
    const overlay = document.getElementById('direct-pdf-loading');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  // Método principal - ULTRA DIRETO
  public async exportToPDF(options: DirectPDFOptions): Promise<void> {
    console.log('🚀 Iniciando exportação direta...');

    try {
      this.showSimpleLoading();

      // Cabeçalho
      this.updateSimpleProgress('Criando cabeçalho...');
      this.addHeader(options.title, options.subtitle);

      // Capturar elementos SEM aguardar muito
      this.updateSimpleProgress('Capturando gráficos...');
      let successCount = 0;

      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateSimpleProgress(`Capturando: ${this.getSectionTitle(elementId)} (${i + 1}/${options.elementIds.length})`);

        const canvas = await this.captureElementDirect(elementId);
        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          successCount++;
        }
      }

      // Rodapé
      this.updateSimpleProgress('Finalizando...');
      this.addFooter();

      // Salvar
      const filename = options.filename || `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      this.hideSimpleLoading();
      this.doc.save(filename);

      // Feedback simples
      console.log(`✅ PDF gerado! ${successCount}/${options.elementIds.length} gráficos capturados`);

      // Alerta simples
      const message = successCount === options.elementIds.length
        ? `✅ PDF gerado com sucesso! ${successCount} gráficos capturados.`
        : `⚠️ PDF gerado com ${successCount}/${options.elementIds.length} gráficos.`;

      alert(message);

    } catch (error) {
      this.hideSimpleLoading();
      console.error('❌ Erro na exportação:', error);
      alert('Erro ao gerar PDF. Verifique o console.');
      throw error;
    }
  }
}

// Função direta de exportação
export async function exportDirectPDF(options: DirectPDFOptions): Promise<void> {
  const exporter = new DirectPDFExporter();
  await exporter.exportToPDF(options);
}

// Função ainda mais simples - só precisa do título e IDs
export async function quickExportPDF(title: string, elementIds: string[]): Promise<void> {
  console.log(`🎯 Exportação rápida: ${title} com ${elementIds.length} elementos`);

  await exportDirectPDF({
    title,
    elementIds
  });
}