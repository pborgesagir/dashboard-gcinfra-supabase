import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DebugPDFOptions {
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

export class DebugAndFixPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private logoBase64: string | null = null;
  private pageNumber: number = 1;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;

    console.log(`📏 PDF dimensions: ${this.pageWidth}x${this.pageHeight}mm`);
  }

  // Função para escanear e encontrar todos os elementos disponíveis
  public static scanAvailableElements(): string[] {
    console.log('🔍 ESCANEANDO ELEMENTOS DISPONÍVEIS...');

    const possibleIds = [
      'kpi-metrics',
      'maintenance-chart',
      'heatmap-chart',
      'work-order-trend',
      'response-time-trend',
      'taxa-cumprimento-chart',
      'causa-chart',
      'familia-chart',
      'tipo-manutencao-chart',
      'setor-chart',
      'equipment-count-chart',
      'distribuicao-prioridade-chart'
    ];

    const foundElements: string[] = [];

    possibleIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const hasContent = element.children.length > 0 || element.textContent?.trim();

        console.log(`📋 ${id}:`);
        console.log(`   ✅ Encontrado: ${element.tagName}`);
        console.log(`   📐 Dimensões: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px`);
        console.log(`   👁️ Visível: ${isVisible}`);
        console.log(`   📄 Tem conteúdo: ${!!hasContent}`);
        console.log(`   🎨 Classes: ${element.className}`);

        if (isVisible && hasContent) {
          foundElements.push(id);
          console.log(`   ✅ VÁLIDO PARA CAPTURA`);
        } else {
          console.log(`   ❌ NÃO VÁLIDO`);
        }
        console.log('');
      } else {
        console.log(`❌ ${id}: ELEMENTO NÃO ENCONTRADO`);
      }
    });

    console.log(`\n📊 RESULTADO DO SCAN:`);
    console.log(`✅ Elementos válidos: ${foundElements.length}`);
    console.log(`📋 Lista: ${foundElements.join(', ')}`);

    return foundElements;
  }

  private async loadLogoForReal(): Promise<void> {
    console.log('🖼️ Tentando carregar logo...');

    try {
      // Método 1: Fetch direto
      console.log('📥 Tentativa 1: Fetch da logo...');
      const response = await fetch('/logodaagir.png');

      if (response.ok) {
        console.log('✅ Logo encontrada via fetch!');
        const blob = await response.blob();
        const img = new Image();

        return new Promise<void>((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = 120;
              canvas.height = 60;

              // Fundo branco
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, 120, 60);

              // Desenhar logo redimensionada
              const aspectRatio = img.width / img.height;
              let drawWidth = 120;
              let drawHeight = 60;

              if (aspectRatio > 2) {
                drawHeight = drawWidth / aspectRatio;
              } else {
                drawWidth = drawHeight * aspectRatio;
              }

              const x = (120 - drawWidth) / 2;
              const y = (60 - drawHeight) / 2;

              ctx.drawImage(img, x, y, drawWidth, drawHeight);

              this.logoBase64 = canvas.toDataURL('image/png', 1.0);
              console.log('✅ Logo processada com sucesso!');
            }
            resolve();
          };

          img.onerror = () => {
            console.warn('❌ Erro ao processar imagem da logo');
            resolve();
          };

          img.src = URL.createObjectURL(blob);
        });
      }
    } catch (error) {
      console.warn('❌ Fetch da logo falhou:', error);
    }

    // Método 2: Logo padrão mais robusta
    console.log('🎨 Criando logo padrão...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = 120;
      canvas.height = 60;

      // Gradiente de fundo
      const gradient = ctx.createLinearGradient(0, 0, 120, 0);
      gradient.addColorStop(0, '#1976d2');
      gradient.addColorStop(1, '#2196f3');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 120, 60);

      // Texto principal
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GCINFRA', 60, 25);

      ctx.font = 'normal 12px Arial';
      ctx.fillText('360º', 60, 42);

      this.logoBase64 = canvas.toDataURL('image/png', 1.0);
      console.log('✅ Logo padrão criada!');
    }
  }

  private addFixedHeader(options: DebugPDFOptions): void {
    console.log('🎨 Adicionando cabeçalho fixo...');

    // FUNDO DO CABEÇALHO - Garantir que seja visível
    this.doc.setFillColor(25, 118, 210); // Azul forte
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');

    // LOGO
    if (this.logoBase64) {
      try {
        this.doc.addImage(this.logoBase64, 'PNG', this.margin, 10, 30, 15);
        console.log('✅ Logo adicionada ao cabeçalho');
      } catch (error) {
        console.error('❌ Erro ao adicionar logo:', error);
      }
    } else {
      console.warn('⚠️ Logo não disponível');
    }

    // TEXTO DO CABEÇALHO - Branco para contrastar com fundo azul
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(20);
    this.doc.setTextColor(255, 255, 255); // BRANCO
    this.doc.text('GCINFRA 360º', this.margin + 40, 20);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255); // BRANCO
    this.doc.text('Plataforma de Gestão de Infraestrutura Hospitalar', this.margin + 40, 28);

    // TÍTULO DO RELATÓRIO
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255); // BRANCO
    this.doc.text(options.title, this.margin + 40, 38);

    // DATA (canto direito)
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(`Gerado em: ${dateStr}`, this.pageWidth - 60, 20);

    console.log('✅ Cabeçalho adicionado com sucesso');

    this.currentY = 60; // Posição após o cabeçalho
  }

  private addFiltersIfAny(filters?: Record<string, unknown>): void {
    if (!filters || Object.keys(filters).length === 0) {
      console.log('📝 Nenhum filtro para adicionar');
      return;
    }

    console.log('📝 Adicionando seção de filtros...');

    // Título da seção
    this.doc.setFillColor(33, 150, 243); // Azul mais claro
    this.doc.rect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 15, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('FILTROS APLICADOS', this.margin, this.currentY + 5);

    this.currentY += 20;

    // Lista de filtros
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(50, 50, 50);

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'todos') {
        const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
        this.doc.text(`• ${key}: ${displayValue}`, this.margin, this.currentY);
        this.currentY += 5;
      }
    });

    this.currentY += 10;
    console.log('✅ Filtros adicionados');
  }

  private async captureElementRobust(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`\n🎯 CAPTURANDO: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Elemento não encontrado: ${elementId}`);
      return null;
    }

    // Log detalhado do elemento
    const rect = element.getBoundingClientRect();
    console.log(`📐 Dimensões: ${rect.width}x${rect.height}`);
    console.log(`📍 Posição: ${rect.top}, ${rect.left}`);
    console.log(`🎨 Classes: ${element.className}`);
    console.log(`📄 Children: ${element.children.length}`);

    // Aguardar renderização
    console.log('⏳ Aguardando renderização...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      console.log('📸 Iniciando captura...');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: rect.width,
        height: rect.height,
        onclone: (clonedDoc, clonedElement) => {
          console.log('🔄 Processando clone...');

          // Forçar fundo branco
          clonedElement.style.backgroundColor = '#ffffff';

          // Remover elementos problemáticos
          const problematic = clonedElement.querySelectorAll('[aria-hidden="true"], .MuiBackdrop-root');
          problematic.forEach(el => el.remove());

          // Garantir visibilidade de gráficos
          const charts = clonedElement.querySelectorAll('.recharts-wrapper, svg');
          charts.forEach(chart => {
            (chart as HTMLElement).style.backgroundColor = '#ffffff';
            (chart as HTMLElement).style.display = 'block';
          });
        }
      });

      // Validar canvas
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        // Verificar se tem conteúdo
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, Math.min(50, canvas.width), Math.min(50, canvas.height));
          const hasContent = imageData.data.some((pixel, index) => {
            if (index % 4 === 3) return false; // Skip alpha
            return pixel < 250; // Not pure white
          });

          if (hasContent) {
            console.log(`✅ CAPTURA SUCESSOSA: ${elementId} (${canvas.width}x${canvas.height})`);
            return canvas;
          } else {
            console.warn(`⚠️ Canvas vazio: ${elementId}`);
          }
        }
      }

      console.error(`❌ Captura falhou: ${elementId}`);
      return null;

    } catch (error) {
      console.error(`💥 Erro na captura ${elementId}:`, error);
      return null;
    }
  }

  private addChartToPDFFixed(canvas: HTMLCanvasElement, elementId: string): void {
    console.log(`📄 Adicionando ao PDF: ${elementId}`);

    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 100;

    // Calcular dimensões
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Verificar se precisa de nova página
    if (this.currentY + imgHeight + 30 > this.pageHeight - 30) {
      console.log('📄 Adicionando nova página...');
      this.doc.addPage();
      this.pageNumber++;
      this.currentY = 30;
    }

    // Título do gráfico
    const title = this.getChartTitle(elementId);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(25, 118, 210);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 15;

    // Centralizar imagem
    const xOffset = (maxWidth - imgWidth) / 2;

    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 0.9);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 20;

    console.log(`✅ Gráfico adicionado: ${elementId}`);
  }

  private getChartTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': 'Análise de Manutenção por Período',
      'heatmap-chart': 'Mapa de Calor - Padrão de Chamados',
      'work-order-trend': 'Tendência de Ordens de Serviço',
      'response-time-trend': 'Tempo Médio de Primeira Resposta',
      'causa-chart': 'Top 10 Ordens de Serviço por Causa',
      'familia-chart': 'Top 10 Ordens de Serviço por Família',
      'tipo-manutencao-chart': 'Top 10 por Tipo de Manutenção',
      'setor-chart': 'Top 10 Ordens de Serviço por Setor',
      'taxa-cumprimento-chart': 'Taxa de Cumprimento de OS Planejadas',
      'equipment-count-chart': 'Top 10 Equipamentos por Quantidade',
      'distribuicao-prioridade-chart': 'Distribuição por Prioridade'
    };
    return titles[elementId] || elementId.replace(/-/g, ' ');
  }

  private addFixedFooter(): void {
    console.log('📝 Adicionando rodapé...');

    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      const footerY = this.pageHeight - 15;

      // Fundo do rodapé
      this.doc.setFillColor(240, 240, 240);
      this.doc.rect(0, footerY - 10, this.pageWidth, 25, 'F');

      // Linha superior
      this.doc.setDrawColor(25, 118, 210);
      this.doc.setLineWidth(1);
      this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);

      // Texto do rodapé
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(25, 118, 210);
      this.doc.text('GCINFRA 360º', this.margin, footerY - 2);

      // Página
      const pageText = `Página ${i} de ${pageCount}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY - 2);

      // Data
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('Sistema de Gestão de Infraestrutura Hospitalar', this.margin, footerY + 5);
    }

    console.log('✅ Rodapé adicionado');
  }

  private showSimpleProgress(): void {
    const overlay = document.createElement('div');
    overlay.id = 'debug-pdf-progress';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(25, 118, 210, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 10px;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">GCINFRA 360º</div>
        <div style="font-size: 16px; margin-bottom: 20px;">Gerando PDF Corrigido</div>
        <div id="debug-progress-status" style="font-size: 14px;">Preparando...</div>
        <div style="margin-top: 20px; width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px;">
          <div id="debug-progress-bar" style="width: 0%; height: 100%; background: white; border-radius: 2px; transition: width 0.3s;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateProgress(current: number, total: number, elementId: string): void {
    const statusEl = document.getElementById('debug-progress-status');
    const barEl = document.getElementById('debug-progress-bar');

    if (statusEl) {
      statusEl.textContent = `Processando: ${elementId} (${current}/${total})`;
    }

    if (barEl) {
      const percentage = (current / total) * 100;
      barEl.style.width = `${percentage}%`;
    }
  }

  private hideProgress(): void {
    const overlay = document.getElementById('debug-pdf-progress');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  public async exportToPDF(options: DebugPDFOptions): Promise<void> {
    console.log('\n🚀 INICIANDO EXPORTAÇÃO DEBUG...');

    try {
      this.showSimpleProgress();

      // 1. Carregar logo
      console.log('🖼️ Carregando logo...');
      await this.loadLogoForReal();

      // 2. Adicionar cabeçalho
      console.log('🎨 Adicionando cabeçalho...');
      this.addFixedHeader(options);

      // 3. Adicionar filtros
      console.log('📝 Adicionando filtros...');
      this.addFiltersIfAny(options.filters);

      // 4. Processar cada gráfico
      let successCount = 0;
      console.log(`📊 Processando ${options.elementIds.length} gráficos...`);

      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateProgress(i + 1, options.elementIds.length, elementId);

        const canvas = await this.captureElementRobust(elementId);
        if (canvas) {
          this.addChartToPDFFixed(canvas, elementId);
          successCount++;
          console.log(`✅ Sucesso ${successCount}/${options.elementIds.length}`);
        } else {
          console.log(`❌ Falha ${i + 1}/${options.elementIds.length}`);
        }
      }

      // 5. Adicionar rodapé
      console.log('📝 Adicionando rodapé...');
      this.addFixedFooter();

      // 6. Salvar arquivo
      const filename = options.filename || `GCINFRA_360_DEBUG_${new Date().toISOString().split('T')[0]}.pdf`;
      this.hideProgress();
      this.doc.save(filename);

      console.log(`\n🎉 EXPORTAÇÃO CONCLUÍDA!`);
      console.log(`✅ Gráficos capturados: ${successCount}/${options.elementIds.length}`);
      console.log(`📄 Páginas: ${this.pageNumber}`);
      console.log(`📁 Arquivo: ${filename}`);

      // Notificação
      alert(`🎉 PDF Gerado!\n\n✅ ${successCount}/${options.elementIds.length} gráficos\n📄 ${this.pageNumber} páginas\n📁 ${filename}`);

    } catch (error) {
      this.hideProgress();
      console.error('💥 ERRO CRÍTICO:', error);
      throw error;
    }
  }
}

// Função principal
export async function exportDebugPDF(options: DebugPDFOptions): Promise<void> {
  const exporter = new DebugAndFixPDFExporter();
  await exporter.exportToPDF(options);
}

// Função de teste que escaneia primeiro
export function testDebugPDF() {
  console.log('🧪 TESTE DEBUG - ESCANEANDO E EXPORTANDO...');

  // Primeiro, escanear elementos disponíveis
  const availableElements = DebugAndFixPDFExporter.scanAvailableElements();

  if (availableElements.length === 0) {
    alert('❌ NENHUM ELEMENTO ENCONTRADO!\n\nVerifique se o dashboard está carregado.');
    return;
  }

  console.log(`🎯 Exportando ${availableElements.length} elementos encontrados...`);

  exportDebugPDF({
    title: 'Dashboard de Manutenção - DEBUG',
    subtitle: 'Teste de Depuração',
    companyName: 'Teste Debug',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: {
      empresa: 'Teste Debug',
      periodo: 'Último ano',
      status: 'Teste'
    },
    elementIds: availableElements,
    filename: `Debug_PDF_${new Date().toISOString().split('T')[0]}.pdf`
  });
}

// Disponibilizar no console
if (typeof window !== 'undefined') {
  (window as unknown as {
    testDebugPDF: typeof testDebugPDF;
    scanElements: typeof DebugAndFixPDFExporter.scanAvailableElements;
  }).testDebugPDF = testDebugPDF;
  (window as unknown as {
    testDebugPDF: typeof testDebugPDF;
    scanElements: typeof DebugAndFixPDFExporter.scanAvailableElements;
  }).scanElements = DebugAndFixPDFExporter.scanAvailableElements;
}