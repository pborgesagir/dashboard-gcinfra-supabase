import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SimplePDFOptions {
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

export class SimplePDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 15; // Margens menores para mais espaço

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  // Aguardar que os gráficos carreguem completamente
  private async waitForCharts(): Promise<void> {
    // Aguardar um tempo para os gráficos renderizarem
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Disparar evento de resize para forçar re-render dos gráficos
    window.dispatchEvent(new Event('resize'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Aguardar animações terminarem
    const animations = document.getAnimations();
    if (animations.length > 0) {
      await Promise.allSettled(animations.map(anim => anim.finished));
    }
  }

  // Cabeçalho simples e limpo
  private addHeader(title: string, subtitle?: string): void {
    // Logo simples (se existir)
    this.addLogo();

    // Título principal
    this.doc.setFontSize(20);
    this.doc.setTextColor(25, 118, 210); // Azul do tema
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GCINFRA 360º', this.margin + 30, 20);

    // Linha decorativa
    this.doc.setDrawColor(25, 118, 210);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25);

    // Título do relatório
    this.doc.setFontSize(16);
    this.doc.setTextColor(66, 66, 66);
    this.doc.text(title, this.margin, 35);

    // Subtítulo
    if (subtitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, 42);
      this.currentY = 50;
    } else {
      this.currentY = 45;
    }
  }

  private addLogo(): void {
    try {
      // Adicionar logo simples como texto por enquanto
      this.doc.setFontSize(12);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('🏥', this.margin, 20);
    } catch (error) {
      console.warn('Erro ao adicionar logo:', error);
    }
  }

  // Informações do relatório de forma mais simples
  private addReportInfo(options: SimplePDFOptions): void {
    const now = new Date();

    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);

    // Data de geração
    const dateStr = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    this.doc.text(dateStr, this.pageWidth - this.margin - this.doc.getTextWidth(dateStr), 15);

    // Período se fornecido
    if (options.dateRange) {
      const periodStr = `Período: ${options.dateRange.start.toLocaleDateString('pt-BR')} até ${options.dateRange.end.toLocaleDateString('pt-BR')}`;
      this.doc.setFontSize(9);
      this.doc.setTextColor(66, 66, 66);
      this.doc.text(periodStr, this.margin, this.currentY);
      this.currentY += 8;
    }

    this.currentY += 5;
  }

  // Captura MUITO mais robusta e simples
  private async captureElement(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`Iniciando captura do elemento: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Elemento não encontrado: ${elementId}`);
      return null;
    }

    try {
      // Mostrar indicador visual
      this.showCapturingIndicator(element);

      // Aguardar renderização completa
      await this.ensureFullyRendered(element);

      // Tentar diferentes métodos de captura
      let canvas = await this.tryMultipleCaptureMethods(element);

      this.hideCapturingIndicator(element);

      if (canvas && this.isCanvasValid(canvas)) {
        console.log(`✅ Captura bem-sucedida: ${elementId}`);
        return canvas;
      } else {
        console.warn(`❌ Captura falhou: ${elementId}`);
        return null;
      }

    } catch (error) {
      this.hideCapturingIndicator(element);
      console.error(`Erro na captura de ${elementId}:`, error);
      return null;
    }
  }

  private async ensureFullyRendered(element: HTMLElement): Promise<void> {
    // Forçar layout
    element.offsetHeight;

    // Aguardar imagens
    const images = element.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1000);
      });
    }));

    // Aguardar SVGs e Canvas
    const svgs = element.querySelectorAll('svg');
    const canvases = element.querySelectorAll('canvas');

    if (svgs.length > 0 || canvases.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Aguardar mais um pouco para gráficos complexos
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async tryMultipleCaptureMethods(element: HTMLElement): Promise<HTMLCanvasElement | null> {
    // Método 1: Configuração otimizada para gráficos
    try {
      console.log('Tentativa 1: Configuração otimizada');
      const canvas1 = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc, clonedElement) => {
          // Garantir que SVGs tenham dimensões
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach(svg => {
            if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
              const rect = svg.getBoundingClientRect();
              svg.setAttribute('width', rect.width.toString());
              svg.setAttribute('height', rect.height.toString());
            }
          });
        }
      });

      if (this.isCanvasValid(canvas1)) {
        return canvas1;
      }
    } catch (error) {
      console.warn('Método 1 falhou:', error);
    }

    // Método 2: Configuração mais conservadora
    try {
      console.log('Tentativa 2: Configuração conservadora');
      const canvas2 = await html2canvas(element, {
        scale: 1,
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      if (this.isCanvasValid(canvas2)) {
        return canvas2;
      }
    } catch (error) {
      console.warn('Método 2 falhou:', error);
    }

    // Método 3: Configuração mínima
    try {
      console.log('Tentativa 3: Configuração mínima');
      const canvas3 = await html2canvas(element, {
        backgroundColor: '#ffffff'
      });

      return canvas3; // Retornar mesmo se não for perfeito
    } catch (error) {
      console.warn('Método 3 falhou:', error);
      return null;
    }
  }

  private isCanvasValid(canvas: HTMLCanvasElement): boolean {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return false;
    }

    // Verificar se não está completamente branco
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
    const data = imageData.data;

    let nonWhitePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a > 0 && (r < 250 || g < 250 || b < 250)) {
        nonWhitePixels++;
      }
    }

    return nonWhitePixels > 10; // Pelo menos alguns pixels não-brancos
  }

  private showCapturingIndicator(element: HTMLElement): void {
    const indicator = document.createElement('div');
    indicator.id = `capturing-${element.id}`;
    indicator.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: #1976d2;
      color: white;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 11px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    indicator.textContent = '📸 Capturando...';

    element.style.position = 'relative';
    element.appendChild(indicator);
  }

  private hideCapturingIndicator(element: HTMLElement): void {
    const indicator = document.getElementById(`capturing-${element.id}`);
    if (indicator) {
      indicator.remove();
    }
  }

  // Adicionar imagem ao PDF de forma mais inteligente
  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);

    // Calcular dimensões para A4
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 80; // Altura máxima fixa para consistência

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Ajustar se muito alto
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Nova página se necessário
    if (this.currentY + imgHeight + 25 > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Título da seção - mais simples
    if (sectionTitle) {
      this.doc.setFontSize(11);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Centralizar imagem
    const xOffset = (maxWidth - imgWidth) / 2;

    // Borda simples
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.2);
    this.doc.rect(this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 0.8);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 15;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores de Performance (KPIs)',
      'maintenance-chart': 'Gráfico de Manutenção',
      'heatmap-chart': 'Mapa de Calor de Chamados',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Tempo de Resposta',
      'causa-chart': 'Distribuição por Causa',
      'familia-chart': 'Distribuição por Família',
      'tipo-manutencao-chart': 'Tipos de Manutenção',
      'setor-chart': 'Distribuição por Setor',
      'taxa-cumprimento-chart': 'Taxa de Cumprimento',
      'equipment-count-chart': 'Contagem de Equipamentos',
      'company-status-gauges': 'Status das Empresas',
      'company-trend-chart': 'Tendências das Empresas',
      'mtbf-benchmarking-chart': 'Benchmarking MTBF'
    };
    return titles[elementId] || '';
  }

  // Rodapé simples
  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Linha no rodapé
      this.doc.setDrawColor(25, 118, 210);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);

      // Texto do rodapé
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('GCINFRA 360º - Plataforma de Gestão de Infraestrutura Hospitalar', this.margin, this.pageHeight - 8);

      // Número da página
      const pageText = `Página ${i} de ${pageCount}`;
      const pageTextWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 8);
    }
  }

  // Loading simples e eficaz
  private showLoading(): void {
    const overlay = document.createElement('div');
    overlay.id = 'simple-pdf-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(25, 118, 210, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h2 style="margin: 0 0 10px; font-size: 24px;">Gerando PDF</h2>
        <p id="simple-progress" style="margin: 0; font-size: 16px;">Preparando captura dos gráficos...</p>
        <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 20px auto;">
          <div id="simple-progress-bar" style="width: 0%; height: 100%; background: white; border-radius: 2px; transition: width 0.3s;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateProgress(current: number, total: number, elementId: string): void {
    const progressElement = document.getElementById('simple-progress');
    const progressBar = document.getElementById('simple-progress-bar');

    if (progressElement && progressBar) {
      const percentage = Math.round((current / total) * 100);
      const sectionName = this.getSectionTitle(elementId) || elementId;

      progressElement.textContent = `Processando: ${sectionName} (${current + 1}/${total})`;
      progressBar.style.width = `${percentage}%`;
    }
  }

  private hideLoading(): void {
    const overlay = document.getElementById('simple-pdf-loading');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  // Método principal - MUITO mais simples e robusto
  public async exportToPDF(options: SimplePDFOptions): Promise<void> {
    try {
      this.showLoading();

      // Aguardar gráficos carregarem
      await this.waitForCharts();

      // Cabeçalho
      this.addHeader(options.title, options.subtitle);

      // Informações do relatório
      this.addReportInfo(options);

      // Capturar elementos
      let successCount = 0;
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateProgress(i, options.elementIds.length, elementId);

        const canvas = await this.captureElement(elementId);
        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          successCount++;
        }
      }

      // Rodapé
      this.addFooter();

      // Salvar
      const filename = options.filename || `GCINFRA_360_${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      this.hideLoading();
      this.doc.save(filename);

      // Feedback
      this.showSuccess(successCount, options.elementIds.length);

    } catch (error) {
      this.hideLoading();
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
      throw error;
    }
  }

  private showSuccess(captured: number, total: number): void {
    const message = captured === total
      ? `✅ PDF gerado com sucesso! ${captured} gráficos capturados.`
      : `⚠️ PDF gerado com ${captured}/${total} gráficos capturados.`;

    console.log(message);

    // Notificação simples
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${captured === total ? '#4caf50' : '#ff9800'};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
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

// Função de exportação simples
export async function exportSimplePDF(options: SimplePDFOptions): Promise<void> {
  const exporter = new SimplePDFExporter();
  await exporter.exportToPDF(options);
}