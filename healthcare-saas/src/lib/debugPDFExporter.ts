import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DebugPDFOptions {
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

export class DebugPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 15;
  private debug: string[] = []; // Log de debug

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private log(message: string): void {
    console.log(message);
    this.debug.push(message);
  }

  // Análise detalhada do elemento antes da captura
  private analyzeElement(elementId: string): boolean {
    const element = document.getElementById(elementId);
    if (!element) {
      this.log(`❌ ELEMENTO NÃO ENCONTRADO: ${elementId}`);
      return false;
    }

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    this.log(`📊 ANALISANDO: ${elementId}`);
    this.log(`   📏 Dimensões: ${rect.width}x${rect.height}`);
    this.log(`   👁️ Visível: ${rect.width > 0 && rect.height > 0}`);
    this.log(`   🎨 Display: ${styles.display}`);
    this.log(`   📍 Position: ${styles.position}`);
    this.log(`   🌈 Opacity: ${styles.opacity}`);

    // Verificar se tem SVG ou Canvas
    const svgs = element.querySelectorAll('svg');
    const canvases = element.querySelectorAll('canvas');
    const rechartsElements = element.querySelectorAll('[class*="recharts"]');

    this.log(`   🖼️ SVGs: ${svgs.length}`);
    this.log(`   🎨 Canvas: ${canvases.length}`);
    this.log(`   📈 Recharts: ${rechartsElements.length}`);

    // Verificar se está sendo renderizado
    if (rect.width === 0 || rect.height === 0) {
      this.log(`   ⚠️ PROBLEMA: Elemento com dimensões zero`);
      return false;
    }

    if (styles.display === 'none') {
      this.log(`   ⚠️ PROBLEMA: Elemento oculto (display: none)`);
      return false;
    }

    if (styles.opacity === '0') {
      this.log(`   ⚠️ PROBLEMA: Elemento transparente (opacity: 0)`);
      return false;
    }

    this.log(`   ✅ Elemento válido para captura`);
    return true;
  }

  // Captura com múltiplas tentativas e análise detalhada
  private async captureElementDebug(elementId: string): Promise<HTMLCanvasElement | null> {
    this.log(`\n🎯 INICIANDO CAPTURA: ${elementId}`);

    // 1. Análise inicial
    if (!this.analyzeElement(elementId)) {
      return null;
    }

    const element = document.getElementById(elementId)!;

    try {
      // 2. Preparação específica baseada no tipo de elemento
      await this.prepareElementForCapture(element, elementId);

      // 3. Múltiplas tentativas de captura (Básico Otimizado primeiro - teve 85% sucesso)
      const methods = [
        {
          name: 'Método 1: Básico Otimizado',
          options: {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true,
            onclone: (clonedDoc: Document) => {
              this.removeMUIProblematicElements(clonedDoc);
              this.optimizeForCleanBackground(clonedDoc);
            }
          }
        },
        {
          name: 'Método 2: SVG Focado',
          options: {
            scale: 1.5,
            useCORS: false,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc: Document) => {
              this.fixSVGElements(clonedDoc);
              this.removeMUIProblematicElements(clonedDoc);
            }
          }
        },
        {
          name: 'Método 3: Recharts Básico',
          options: {
            scale: 1,
            backgroundColor: '#ffffff',
            logging: false,
            foreignObjectRendering: true
          }
        }
      ];

      for (const method of methods) {
        try {
          this.log(`   🔄 Tentando: ${method.name}`);

          const canvas = await html2canvas(element, method.options);

          if (this.validateCanvas(canvas, elementId)) {
            this.log(`   ✅ SUCESSO com ${method.name}`);
            return canvas;
          } else {
            this.log(`   ❌ Canvas inválido com ${method.name}`);
          }

        } catch (error) {
          this.log(`   ❌ FALHA em ${method.name}: ${error}`);
        }
      }

      this.log(`   💀 TODAS AS TENTATIVAS FALHARAM para ${elementId}`);
      return null;

    } catch (error) {
      this.log(`   💥 ERRO GERAL em ${elementId}: ${error}`);
      return null;
    }
  }

  // Preparação específica por tipo de elemento
  private async prepareElementForCapture(element: HTMLElement, elementId: string): Promise<void> {
    this.log(`   🔧 Preparando elemento ${elementId}...`);

    // Force layout recalculation
    element.offsetHeight;

    // Se tem Recharts, forçar re-render
    if (element.querySelector('[class*="recharts"]')) {
      this.log(`   📊 Detectado Recharts - forçando re-render`);
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Se tem SVG, garantir dimensões
    const svgs = element.querySelectorAll('svg');
    if (svgs.length > 0) {
      this.log(`   🖼️ Detectado ${svgs.length} SVGs - ajustando dimensões`);
      svgs.forEach(svg => {
        if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', rect.width.toString());
          svg.setAttribute('height', rect.height.toString());
        }
      });
    }

    // Aguardar um pouco para garantir renderização
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Preparar documento clonado
  private prepareClonedDocument(clonedDoc: Document, elementId: string): void {
    this.log(`   🧬 Preparando clone para ${elementId}`);

    // Remover elementos problemáticos
    const problematic = clonedDoc.querySelectorAll(`
      .MuiBackdrop-root,
      .recharts-tooltip-wrapper,
      .recharts-active-dot,
      [style*="pointer-events: none"]
    `);

    problematic.forEach(el => {
      this.log(`   🗑️ Removendo elemento problemático: ${el.className}`);
      el.remove();
    });

    // Garantir visibilidade de textos
    const texts = clonedDoc.querySelectorAll('text, tspan, .recharts-text');
    texts.forEach(text => {
      const textEl = text as HTMLElement;
      textEl.style.visibility = 'visible';
      textEl.style.opacity = '1';
    });
  }

  // Corrigir SVGs especificamente
  private fixSVGElements(clonedDoc: Document): void {
    const svgs = clonedDoc.querySelectorAll('svg');
    svgs.forEach(svg => {
      // Garantir namespace
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Garantir dimensões
      if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
        svg.setAttribute('width', '400');
        svg.setAttribute('height', '300');
      }

      // Garantir viewBox
      if (!svg.getAttribute('viewBox')) {
        const width = svg.getAttribute('width') || '400';
        const height = svg.getAttribute('height') || '300';
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    });
  }

  // Validação mais rigorosa do canvas
  private validateCanvas(canvas: HTMLCanvasElement, elementId: string): boolean {
    if (!canvas) {
      this.log(`   ❌ Canvas é null para ${elementId}`);
      return false;
    }

    if (canvas.width === 0 || canvas.height === 0) {
      this.log(`   ❌ Canvas com dimensões zero: ${canvas.width}x${canvas.height}`);
      return false;
    }

    // Verificar se não está completamente branco/transparente
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.log(`   ❌ Não foi possível obter contexto do canvas`);
      return false;
    }

    try {
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
      this.log(`   📊 Conteúdo: ${contentPercentage.toFixed(1)}% (${nonWhitePixels}/${totalPixels} pixels)`);

      if (contentPercentage < 1) {
        this.log(`   ❌ Canvas muito vazio (${contentPercentage.toFixed(1)}% de conteúdo)`);
        return false;
      }

      this.log(`   ✅ Canvas válido: ${canvas.width}x${canvas.height}, ${contentPercentage.toFixed(1)}% conteúdo`);
      return true;

    } catch (error) {
      this.log(`   ❌ Erro ao validar canvas: ${error}`);
      return false;
    }
  }

  // Remove elementos MUI problemáticos detectados nos logs
  private removeMUIProblematicElements(doc: Document): void {
    // Elementos MUI problemáticos identificados
    const problematicSelectors = [
      '[class*="MuiSelect-nativeInput"]',
      '[class*="MuiBackdrop-root"]',
      '[class*="MuiModal-backdrop"]',
      '[class*="MuiButtonBase-root Mui-disabled"]',
      'input[aria-hidden="true"]',
      '[class*="MuiInputBase-inputHiddenLabel"]'
    ];

    problematicSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        this.log(`   🧹 Removendo elemento problemático: ${el.className || el.tagName}`);
        el.remove();
      });
    });

    // Remove SVG AnimatedString objects
    const svgs = doc.querySelectorAll('svg');
    svgs.forEach(svg => {
      const attributes = ['class', 'id'];
      attributes.forEach(attr => {
        const value = svg.getAttribute(attr);
        if (value && value.toString().includes('[object SVGAnimatedString]')) {
          this.log(`   🧹 Removendo SVG problemático: ${value}`);
          svg.removeAttribute(attr);
        }
      });
    });
  }

  // Otimiza elementos para fundo limpo e boa aparência
  private optimizeForCleanBackground(doc: Document): void {
    // Remove fundos cinzas/escuros de containers
    const containers = doc.querySelectorAll('div, section, article');
    containers.forEach(container => {
      const styles = window.getComputedStyle(container);
      const bgColor = styles.backgroundColor;

      // Remove fundos cinzas/escuros
      if (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgb(128') || bgColor.includes('grey') || bgColor.includes('gray')) {
        (container as HTMLElement).style.backgroundColor = 'transparent';
        this.log(`   🎨 Removendo fundo cinza de container`);
      }
    });

    // Força fundo branco em elementos principais
    const mainElements = doc.querySelectorAll('[class*="recharts"], [class*="chart"], svg');
    mainElements.forEach(el => {
      (el as HTMLElement).style.backgroundColor = '#ffffff';
    });

    // Remove sombras que podem causar fundos cinzas
    const shadowElements = doc.querySelectorAll('*');
    shadowElements.forEach(el => {
      (el as HTMLElement).style.boxShadow = 'none';
      (el as HTMLElement).style.filter = 'none';
    });
  }

  // Resto do código simplificado
  private addHeader(title: string): void {
    this.doc.setFontSize(16);
    this.doc.setTextColor(25, 118, 210);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('GCINFRA 360º', this.margin, 20);

    this.doc.setDrawColor(25, 118, 210);
    this.doc.line(this.margin, 25, this.pageWidth - this.margin, 25);

    this.doc.setFontSize(12);
    this.doc.setTextColor(66, 66, 66);
    this.doc.text(title, this.margin, 35);

    this.currentY = 45;
  }

  private addImageToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);
    const maxWidth = this.pageWidth - (2 * this.margin);

    // Alturas otimizadas baseadas no tipo de gráfico
    const heightsByType: Record<string, number> = {
      'kpi-metrics': 50,           // KPIs menores
      'heatmap-chart': 80,         // Heatmap maior
      'maintenance-chart': 70,     // Manutenção média
      'work-order-trend': 65,      // Tendências médias
      'response-time-trend': 65,
      'causa-chart': 60,           // Gráficos de pizza menores
      'familia-chart': 60,
      'tipo-manutencao-chart': 60,
      'setor-chart': 60,
      'equipment-count-chart': 70,
      'company-status-gauges': 55,
      'company-trend-chart': 70,
      'mtbf-benchmarking-chart': 75
    };

    const maxHeight = heightsByType[elementId] || 65; // Default 65mm

    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Se muito alto, ajustar para caber
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Se muito largo, centralizar
    if (imgWidth > maxWidth) {
      imgWidth = maxWidth;
      imgHeight = (canvas.height * imgWidth) / canvas.width;
    }

    // Nova página se não couber
    if (this.currentY + imgHeight + 20 > this.pageHeight - 15) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Título melhorado
    if (sectionTitle) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(25, 118, 210);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sectionTitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    const xOffset = (maxWidth - imgWidth) / 2;
    const imgData = canvas.toDataURL('image/png', 0.8);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 8;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': 'KPIs',
      'maintenance-chart': 'Manutenção',
      'heatmap-chart': 'Mapa de Calor',
      'work-order-trend': 'Tendência OS',
      'response-time-trend': 'Tempo Resposta',
      'causa-chart': 'Por Causa',
      'familia-chart': 'Por Família',
      'tipo-manutencao-chart': 'Tipos Manutenção',
      'setor-chart': 'Por Setor',
      'taxa-cumprimento-chart': 'Taxa Cumprimento',
      'equipment-count-chart': 'Equipamentos',
      'company-status-gauges': 'Status Empresas',
      'company-trend-chart': 'Tendências',
      'mtbf-benchmarking-chart': 'MTBF'
    };
    return titles[elementId] || elementId;
  }

  private showDebugLoading(): void {
    const overlay = document.createElement('div');
    overlay.id = 'debug-pdf-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(25, 118, 210, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: monospace;
      font-size: 14px;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 80%; max-height: 80%; overflow-y: auto;">
        <div style="font-size: 30px; margin-bottom: 15px;">🔍</div>
        <div style="font-size: 18px; margin-bottom: 10px;">Análise Detalhada de PDF</div>
        <div id="debug-progress" style="margin-bottom: 15px;">Iniciando análise...</div>
        <div id="debug-log" style="text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; max-height: 300px; overflow-y: auto; font-size: 11px;"></div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  private updateDebugProgress(message: string): void {
    const progressEl = document.getElementById('debug-progress');
    const logEl = document.getElementById('debug-log');

    if (progressEl) {
      progressEl.textContent = message;
    }

    if (logEl) {
      logEl.innerHTML = this.debug.slice(-20).map(line =>
        `<div style="margin: 2px 0; ${line.includes('✅') ? 'color: #4caf50' : line.includes('❌') || line.includes('💀') ? 'color: #f44336' : line.includes('⚠️') ? 'color: #ff9800' : ''}">${line}</div>`
      ).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  private hideDebugLoading(): void {
    const overlay = document.getElementById('debug-pdf-loading');
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }

  // Método principal com debug completo
  public async exportToPDF(options: DebugPDFOptions): Promise<void> {
    this.log(`🚀 INICIANDO EXPORTAÇÃO DEBUG`);
    this.log(`📋 Elementos solicitados: ${options.elementIds.length}`);
    this.log(`📊 IDs: ${options.elementIds.join(', ')}`);

    try {
      this.showDebugLoading();

      this.addHeader(options.title);

      let successCount = 0;
      const results: Array<{id: string, success: boolean, reason?: string}> = [];

      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateDebugProgress(`Analisando: ${elementId} (${i + 1}/${options.elementIds.length})`);

        const canvas = await this.captureElementDebug(elementId);

        if (canvas) {
          this.addImageToPDF(canvas, elementId);
          successCount++;
          results.push({id: elementId, success: true});
        } else {
          results.push({id: elementId, success: false, reason: 'Captura falhou'});
        }

        this.updateDebugProgress(`Processados: ${i + 1}/${options.elementIds.length} (${successCount} sucessos)`);
      }

      const filename = `DEBUG_${options.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      this.hideDebugLoading();
      this.doc.save(filename);

      // Relatório final detalhado
      this.log(`\n📊 RELATÓRIO FINAL:`);
      this.log(`✅ Sucessos: ${successCount}/${options.elementIds.length}`);
      this.log(`❌ Falhas: ${options.elementIds.length - successCount}`);

      results.forEach(result => {
        if (result.success) {
          this.log(`   ✅ ${result.id}`);
        } else {
          this.log(`   ❌ ${result.id} - ${result.reason}`);
        }
      });

      // Mostrar resultado
      alert(`PDF Debug gerado!\n✅ ${successCount}/${options.elementIds.length} gráficos\n\nVeja o console para análise detalhada.`);

    } catch (error) {
      this.hideDebugLoading();
      this.log(`💥 ERRO FATAL: ${error}`);
      console.error('Log completo:', this.debug);
      throw error;
    }
  }
}

// Função de exportação com debug
export async function exportDebugPDF(options: DebugPDFOptions): Promise<void> {
  const exporter = new DebugPDFExporter();
  await exporter.exportToPDF(options);
}

// Função para analisar elementos na página atual
export function analyzePageElements(): void {
  console.log('🔍 ANÁLISE DE ELEMENTOS NA PÁGINA');

  const possibleIds = [
    'kpi-metrics', 'maintenance-chart', 'heatmap-chart', 'work-order-trend',
    'response-time-trend', 'causa-chart', 'familia-chart', 'tipo-manutencao-chart',
    'setor-chart', 'taxa-cumprimento-chart', 'equipment-count-chart',
    'company-status-gauges', 'company-trend-chart', 'mtbf-benchmarking-chart'
  ];

  const found: string[] = [];
  const missing: string[] = [];

  possibleIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0;
      found.push(`${id} (${visible ? 'visível' : 'oculto'})`);
    } else {
      missing.push(id);
    }
  });

  console.log(`✅ Elementos encontrados (${found.length}):`);
  found.forEach(item => console.log(`   📊 ${item}`));

  console.log(`❌ Elementos ausentes (${missing.length}):`);
  missing.forEach(item => console.log(`   💭 ${item}`));

  // Buscar outros elementos com IDs relacionados
  const allElements = Array.from(document.querySelectorAll('[id*="chart"], [id*="metrics"], [id*="gauge"]'))
    .map(el => el.id)
    .filter(id => id && !possibleIds.includes(id));

  if (allElements.length > 0) {
    console.log(`🔍 Outros elementos encontrados (${allElements.length}):`);
    allElements.forEach(id => console.log(`   🎯 ${id}`));
  }
}

// Disponibilizar no window para uso no console
if (typeof window !== 'undefined') {
  (window as any).analyzePageElements = analyzePageElements;
  (window as any).exportDebugPDF = exportDebugPDF;
}