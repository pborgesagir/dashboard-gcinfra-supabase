import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
  elementIds: string[];
  filename?: string;
  companyName?: string;
}

export class FixedPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 15;
  private logoBase64: string | null = null;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private async loadLogo(): Promise<void> {
    try {
      const img = new Image();
      return new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // Redimensionar para tamanho adequado
              const maxWidth = 120;
              const maxHeight = 60;
              let { width, height } = img;

              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }

              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }

              canvas.width = width;
              canvas.height = height;

              // Fundo branco
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);

              // Desenhar logo
              ctx.drawImage(img, 0, 0, width, height);

              this.logoBase64 = canvas.toDataURL('image/png', 0.9);
            }
          } catch (error) {
            console.warn('Erro ao processar logo:', error);
          } finally {
            resolve();
          }
        };

        img.onerror = () => {
          console.warn('Logo não encontrada, continuando sem logo');
          resolve();
        };

        // Tentar diferentes caminhos para o logo
        img.src = '/logodaagir.png';

        // Timeout de 3 segundos
        setTimeout(resolve, 3000);
      });
    } catch (error) {
      console.warn('Erro ao carregar logo:', error);
    }
  }

  private addHeader(options: PDFExportOptions): void {
    // Cores da marca
    const primaryBlue = [25, 118, 210];
    const lightGray = [248, 250, 252];

    // Fundo do cabeçalho
    this.doc.setFillColor(...lightGray);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');

    // Linha superior azul
    this.doc.setFillColor(...primaryBlue);
    this.doc.rect(0, 0, this.pageWidth, 3, 'F');

    // Logo (se disponível)
    if (this.logoBase64) {
      try {
        this.doc.addImage(this.logoBase64, 'PNG', this.margin, 8, 30, 15);
      } catch (error) {
        console.warn('Erro ao adicionar logo ao PDF:', error);
      }
    }

    // Título principal
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(...primaryBlue);
    this.doc.text('GCINFRA 360º', this.margin + 35, 18);

    // Subtítulo
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Plataforma de Gestão de Infraestrutura Hospitalar', this.margin + 35, 25);

    // Título do relatório
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(options.title, this.margin, 38);

    // Data de geração
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(`Gerado em: ${dateStr}`, this.margin, 45);

    // Período (se disponível)
    if (options.dateRange) {
      const startStr = options.dateRange.start.toLocaleDateString('pt-BR');
      const endStr = options.dateRange.end.toLocaleDateString('pt-BR');
      this.doc.text(`Período: ${startStr} - ${endStr}`, this.margin + 70, 45);
    }

    this.currentY = 55;
  }

  private addFiltersSection(filters?: Record<string, unknown>): void {
    if (!filters || Object.keys(filters).length === 0) return;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(25, 118, 210);
    this.doc.text('Filtros Aplicados:', this.margin, this.currentY);

    this.currentY += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(80, 80, 80);

    let filterCount = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'todos' && value !== 'Todos') {
        let displayValue = '';

        if (Array.isArray(value)) {
          displayValue = value.length > 3 ? `${value.slice(0, 3).join(', ')}... (+${value.length - 3})` : value.join(', ');
        } else if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
          displayValue = `${String((value as {start: unknown, end: unknown}).start)} - ${String((value as {start: unknown, end: unknown}).end)}`;
        } else {
          displayValue = String(value);
        }

        if (displayValue) {
          const filterText = `• ${this.getFilterLabel(key)}: ${displayValue}`;
          this.doc.text(filterText, this.margin + 5, this.currentY);
          this.currentY += 4;
          filterCount++;
        }
      }
    });

    if (filterCount > 0) {
      this.currentY += 5;
    } else {
      this.currentY -= 8; // Voltar se não houver filtros
    }
  }

  private getFilterLabel(key: string): string {
    const labels: Record<string, string> = {
      'empresa': 'Empresa',
      'setor': 'Setor',
      'equipamento': 'Equipamento',
      'prioridade': 'Prioridade',
      'status': 'Status',
      'tipomanutencao': 'Tipo de Manutenção',
      'situacao': 'Situação',
      'periodo': 'Período',
      'responsavel': 'Responsável',
      'familia': 'Família',
      'oficina': 'Oficina',
      'possuiChamado': 'Possui Chamado'
    };
    return labels[key] || key;
  }

  private async captureElement(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`🎯 Capturando elemento: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`❌ Elemento não encontrado: ${elementId}`);
      return null;
    }

    // Verificar se o elemento está visível
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn(`❌ Elemento com dimensões zero: ${elementId}`);
      return null;
    }

    try {
      // Aguardar um pouco para garantir que gráficos sejam renderizados
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configurações otimizadas para captura
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (el) => {
          // Ignorar elementos problemáticos
          return el.classList.contains('MuiBackdrop-root') ||
                 el.classList.contains('MuiModal-backdrop') ||
                 el.hasAttribute('aria-hidden');
        },
        onclone: (clonedDoc, clonedElement) => {
          // Remover elementos problemáticos do clone
          const problematicSelectors = [
            '[aria-hidden="true"]',
            '.MuiSelect-nativeInput',
            '.MuiBackdrop-root',
            'input[type="hidden"]'
          ];

          problematicSelectors.forEach(selector => {
            const elements = clonedElement.querySelectorAll(selector);
            elements.forEach(el => el.remove());
          });

          // Garantir fundo branco em gráficos
          const charts = clonedElement.querySelectorAll('.recharts-wrapper, svg, [class*="chart"]');
          charts.forEach(chart => {
            (chart as HTMLElement).style.backgroundColor = '#ffffff';
          });
        }
      });

      // Validar se o canvas tem conteúdo
      if (this.validateCanvas(canvas)) {
        console.log(`✅ Captura bem-sucedida: ${elementId}`);
        return canvas;
      } else {
        console.warn(`❌ Canvas vazio ou inválido: ${elementId}`);
        return null;
      }

    } catch (error) {
      console.error(`💥 Erro na captura ${elementId}:`, error);
      return null;
    }
  }

  private validateCanvas(canvas: HTMLCanvasElement): boolean {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return false;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Verificar se há conteúdo não-branco no canvas
      const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
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

      const contentPercentage = (nonWhitePixels / (data.length / 4)) * 100;
      return contentPercentage > 1; // Pelo menos 1% de conteúdo não-branco

    } catch {
      return false;
    }
  }

  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 100; // Altura máxima do gráfico

    // Calcular dimensões proporcionais
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Verificar se precisa de nova página
    if (this.currentY + imgHeight + 30 > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Título da seção
    if (sectionTitle) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(25, 118, 210);
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Centralizar imagem
    const xOffset = (maxWidth - imgWidth) / 2;

    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 0.9);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 15;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': 'Análise de Manutenção por Período',
      'heatmap-chart': 'Mapa de Calor - Padrão de Chamados',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Tendência do Tempo Médio de Primeira Resposta',
      'causa-chart': 'Top 10 Ordens de Serviço por Causa',
      'familia-chart': 'Top 10 Ordens de Serviço por Família',
      'tipo-manutencao-chart': 'Top 10 Ordens de Serviço por Tipo de Manutenção',
      'setor-chart': 'Top 10 Ordens de Serviço por Setor',
      'taxa-cumprimento-chart': 'Taxa Mensal de Cumprimento de OS Planejadas',
      'equipment-count-chart': 'Top 10 Equipamentos por Quantidade de OS',
      'distribuicao-prioridade-chart': 'Distribuição por Prioridade'
    };
    return titles[elementId] || elementId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      const footerY = this.pageHeight - 10;

      // Linha separadora
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

      // Texto do rodapé
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);

      // Esquerda - Sistema
      this.doc.text('GCINFRA 360º - Sistema de Gestão de Infraestrutura', this.margin, footerY);

      // Centro - Confidencial
      const centerText = 'Documento Confidencial';
      const centerX = (this.pageWidth - this.doc.getTextWidth(centerText)) / 2;
      this.doc.text(centerText, centerX, footerY);

      // Direita - Página
      const pageText = `Página ${i} de ${pageCount}`;
      const pageX = this.pageWidth - this.margin - this.doc.getTextWidth(pageText);
      this.doc.text(pageText, pageX, footerY);
    }
  }

  private showProgress(): void {
    const overlay = document.createElement('div');
    overlay.id = 'pdf-export-progress';
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
    const overlay = document.getElementById('pdf-export-progress');
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

  public async exportToPDF(options: PDFExportOptions): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação PDF...');

      this.showProgress();

      // Carregar logo
      await this.loadLogo();

      // Adicionar cabeçalho
      this.addHeader(options);

      // Adicionar filtros
      this.addFiltersSection(options.filters);

      // Capturar e adicionar gráficos
      let capturedCount = 0;
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateProgress(i + 1, options.elementIds.length, elementId);

        const canvas = await this.captureElement(elementId);
        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          capturedCount++;
        }
      }

      // Adicionar rodapé
      this.addFooter();

      // Gerar arquivo
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `GCINFRA_360_Dashboard_${timestamp}.pdf`;

      this.hideProgress();
      this.doc.save(filename);

      // Mostrar resultado
      const message = `✅ Relatório gerado com sucesso!\n📄 Arquivo: ${filename}\n📊 ${capturedCount}/${options.elementIds.length} gráficos capturados`;
      console.log(message);

      // Notificação visual
      this.showSuccessNotification(capturedCount, options.elementIds.length, filename);

    } catch (error) {
      this.hideProgress();
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  }

  private showSuccessNotification(captured: number, total: number, filename: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 30px;
      right: 30px;
      background: ${captured === total ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : 'linear-gradient(135deg, #ff9800, #ffb74d)'};
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-family: 'Segoe UI', sans-serif;
      font-weight: 500;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 10001;
      max-width: 400px;
      line-height: 1.4;
      animation: slideInRight 0.4s ease;
    `;

    const icon = captured === total ? '✅' : '⚠️';
    const status = captured === total ? 'Relatório gerado com sucesso!' : 'Relatório gerado com ressalvas';

    notification.innerHTML = `
      ${icon} <strong>${status}</strong><br>
      📄 Arquivo: ${filename}<br>
      📊 ${captured}/${total} gráficos capturados
    `;

    document.body.appendChild(notification);

    // Estilo da animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Remover após 6 segundos
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

// Função de exportação principal
export async function exportDashboardToPDF(options: PDFExportOptions): Promise<void> {
  const exporter = new FixedPDFExporter();
  await exporter.exportToPDF(options);
}

// Função de teste
export function testPDFExport() {
  console.log('🧪 Testando exportação PDF...');

  // Buscar elementos disponíveis na página
  const allPossibleIds = [
    'kpi-metrics',
    'maintenance-chart',
    'heatmap-chart',
    'work-order-trend',
    'response-time-trend',
    'causa-chart',
    'familia-chart',
    'tipo-manutencao-chart',
    'setor-chart',
    'taxa-cumprimento-chart',
    'equipment-count-chart',
    'distribuicao-prioridade-chart'
  ];

  const availableIds = allPossibleIds.filter(id => document.getElementById(id));

  console.log(`📊 Elementos encontrados: ${availableIds.length}`);
  console.log(`📋 IDs: ${availableIds.join(', ')}`);

  if (availableIds.length === 0) {
    alert('❌ Nenhum gráfico encontrado na página!');
    return;
  }

  exportDashboardToPDF({
    title: 'Dashboard de Manutenção - Teste',
    subtitle: 'Relatório de Teste',
    companyName: 'Empresa de Teste',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: {
      periodo: 'Últimos 12 meses',
      empresa: 'Teste',
      status: 'Todos'
    },
    elementIds: availableIds,
    filename: `Teste_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`
  });
}

// Disponibilizar no console para testes
if (typeof window !== 'undefined') {
  (window as unknown as {
    testPDFExport: typeof testPDFExport;
    exportDashboardToPDF: typeof exportDashboardToPDF;
  }).testPDFExport = testPDFExport;
  (window as unknown as {
    testPDFExport: typeof testPDFExport;
    exportDashboardToPDF: typeof exportDashboardToPDF;
  }).exportDashboardToPDF = exportDashboardToPDF;
}