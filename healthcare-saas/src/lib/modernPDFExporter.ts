import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ModernPDFOptions {
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

export class ModernPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private logoBase64: string | null = null;
  private pageNumber: number = 1;
  private colors = {
    primary: [25, 118, 210],     // Azul principal
    secondary: [33, 150, 243],   // Azul claro
    accent: [255, 193, 7],       // Amarelo/dourado
    dark: [33, 33, 33],          // Cinza escuro
    light: [248, 250, 252],      // Cinza muito claro
    white: [255, 255, 255],      // Branco
    success: [76, 175, 80],      // Verde
    text: [97, 97, 97]           // Cinza texto
  };

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
  }

  private async loadLogoWithFallback(): Promise<void> {
    const logoSources = [
      '/logodaagir.png',
      './public/logodaagir.png',
      '../public/logodaagir.png',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMTAwIDUwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCI+R0NJTkZSQTwvdGV4dD48L3N2Zz4='
    ];

    for (const src of logoSources) {
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              if (ctx) {
                // Redimensionar proporcionalmente
                const maxWidth = 150;
                const maxHeight = 75;
                let { width, height } = img;

                const aspectRatio = width / height;
                if (width > maxWidth) {
                  width = maxWidth;
                  height = width / aspectRatio;
                }
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * aspectRatio;
                }

                canvas.width = width;
                canvas.height = height;

                // Fundo branco para transparências
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Desenhar logo
                ctx.drawImage(img, 0, 0, width, height);

                this.logoBase64 = canvas.toDataURL('image/png', 1.0);
                console.log(`✅ Logo carregada de: ${src}`);
              }
              resolve();
            } catch (error) {
              console.warn(`Erro ao processar logo de ${src}:`, error);
              reject(error);
            }
          };

          img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
          img.src = src;

          // Timeout de 3 segundos por logo
          setTimeout(() => reject(new Error('Timeout')), 3000);
        });

        break; // Se chegou até aqui, logo foi carregada com sucesso
      } catch (error) {
        console.warn(`Tentativa de carregar ${src} falhou:`, error);
        continue;
      }
    }

    if (!this.logoBase64) {
      console.warn('⚠️ Nenhuma logo foi carregada, criando logo padrão');
      this.createDefaultLogo();
    }
  }

  private createDefaultLogo(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = 150;
      canvas.height = 60;

      // Gradiente azul
      const gradient = ctx.createLinearGradient(0, 0, 150, 0);
      gradient.addColorStop(0, '#1976d2');
      gradient.addColorStop(1, '#2196f3');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 150, 60);

      // Texto da logo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GCINFRA', 75, 25);

      ctx.font = 'normal 12px Arial';
      ctx.fillText('360º', 75, 42);

      this.logoBase64 = canvas.toDataURL('image/png', 1.0);
      console.log('✅ Logo padrão criada');
    }
  }

  private addModernHeader(options: ModernPDFOptions): void {
    // Fundo degradê do cabeçalho
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 4, 'F'); // Barra superior

    this.doc.setFillColor(...this.colors.light);
    this.doc.rect(0, 4, this.pageWidth, 56, 'F'); // Fundo do cabeçalho

    // Logo (esquerda)
    if (this.logoBase64) {
      try {
        this.doc.addImage(this.logoBase64, 'PNG', this.margin, 12, 40, 20);
      } catch (error) {
        console.warn('Erro ao adicionar logo:', error);
      }
    }

    // Área de título (centro-direita)
    const titleX = this.logoBase64 ? this.margin + 50 : this.margin;

    // Título principal
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(...this.colors.primary);
    this.doc.text('GCINFRA 360º', titleX, 22);

    // Subtítulo
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...this.colors.text);
    this.doc.text('Plataforma de Gestão de Infraestrutura Hospitalar', titleX, 30);

    // Título do relatório
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(...this.colors.dark);
    this.doc.text(options.title, titleX, 42);

    // Informações na direita
    const rightX = this.pageWidth - this.margin;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.colors.text);

    // Data de geração (alinhada à direita)
    const dateText = `Gerado em: ${dateStr}`;
    const dateWidth = this.doc.getTextWidth(dateText);
    this.doc.text(dateText, rightX - dateWidth, 18);

    // Período (se disponível)
    if (options.dateRange) {
      const startStr = options.dateRange.start.toLocaleDateString('pt-BR');
      const endStr = options.dateRange.end.toLocaleDateString('pt-BR');
      const periodText = `Período: ${startStr} - ${endStr}`;
      const periodWidth = this.doc.getTextWidth(periodText);
      this.doc.text(periodText, rightX - periodWidth, 26);
    }

    // Empresa (se disponível)
    if (options.companyName) {
      const companyText = `Empresa: ${options.companyName}`;
      const companyWidth = this.doc.getTextWidth(companyText);
      this.doc.text(companyText, rightX - companyWidth, 34);
    }

    // Linha separadora elegante
    this.doc.setDrawColor(...this.colors.secondary);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, 55, this.pageWidth - this.margin, 55);

    this.currentY = 70;
  }

  private addStylizedFiltersSection(filters?: Record<string, unknown>): void {
    if (!filters || Object.keys(filters).length === 0) return;

    // Título da seção com ícone
    this.doc.setFillColor(...this.colors.secondary);
    this.doc.rect(this.margin - 5, this.currentY - 5, this.pageWidth - 2 * this.margin + 10, 20, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(...this.colors.white);
    this.doc.text('🔍 FILTROS APLICADOS', this.margin, this.currentY + 5);

    this.currentY += 20;

    // Lista de filtros em colunas
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.colors.dark);

    const leftCol = this.margin + 5;
    const rightCol = this.pageWidth / 2 + 10;
    let currentCol = leftCol;
    let filterCount = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'todos' && value !== 'Todos') {
        let displayValue = '';

        if (Array.isArray(value)) {
          displayValue = value.length > 2 ? `${value.slice(0, 2).join(', ')}... (+${value.length - 2})` : value.join(', ');
        } else if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
          displayValue = `${String((value as {start: unknown, end: unknown}).start)} - ${String((value as {start: unknown, end: unknown}).end)}`;
        } else {
          displayValue = String(value);
        }

        if (displayValue) {
          // Alternar entre colunas
          if (filterCount > 0 && filterCount % 4 === 0) {
            this.currentY += 15;
            currentCol = leftCol;
          } else if (filterCount % 2 === 1) {
            currentCol = rightCol;
          } else {
            currentCol = leftCol;
          }

          // Label do filtro
          this.doc.setFont('helvetica', 'bold');
          this.doc.setTextColor(...this.colors.primary);
          this.doc.text(`${this.getFilterLabel(key)}:`, currentCol, this.currentY);

          // Valor do filtro
          this.doc.setFont('helvetica', 'normal');
          this.doc.setTextColor(...this.colors.text);
          const labelWidth = this.doc.getTextWidth(`${this.getFilterLabel(key)}: `);
          this.doc.text(displayValue, currentCol + labelWidth, this.currentY);

          filterCount++;
          if (filterCount % 2 === 0) {
            this.currentY += 6;
          }
        }
      }
    });

    this.currentY += 15;
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

  private async captureElementAdvanced(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`🎯 [CAPTURA AVANÇADA] Iniciando: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`❌ Elemento não encontrado: ${elementId}`);
      return null;
    }

    // Verificar visibilidade
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn(`❌ Elemento invisível: ${elementId} (${rect.width}x${rect.height})`);
      return null;
    }

    // Aguardar renderização completa
    await this.waitForElementReady(element);

    // Tentar múltiplas estratégias de captura
    const strategies = [
      () => this.captureWithOptimizedSettings(element),
      () => this.captureWithCloning(element),
      () => this.captureWithForceRender(element)
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`   🔄 Estratégia ${i + 1}/3: ${elementId}`);
        const canvas = await strategies[i]();

        if (this.validateCanvas(canvas, elementId)) {
          console.log(`   ✅ SUCESSO na estratégia ${i + 1}: ${elementId}`);
          return canvas;
        }
      } catch (error) {
        console.warn(`   ⚠️ Estratégia ${i + 1} falhou para ${elementId}:`, error);
      }
    }

    console.error(`❌ Todas as estratégias falharam para: ${elementId}`);
    return null;
  }

  private async waitForElementReady(element: HTMLElement): Promise<void> {
    // Aguardar fontes
    if (document.fonts) {
      await document.fonts.ready;
    }

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

    // Aguardar gráficos Recharts
    if (element.querySelector('.recharts-wrapper')) {
      console.log('   📊 Detectado Recharts, aguardando renderização...');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Forçar recálculo de layout
    void element.offsetHeight;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async captureWithOptimizedSettings(element: HTMLElement): Promise<HTMLCanvasElement> {
    return html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 15000,
      removeContainer: true,
      ignoreElements: (el) => {
        const classList = el.classList.toString();
        return classList.includes('MuiBackdrop') ||
               classList.includes('MuiModal') ||
               el.hasAttribute('aria-hidden') ||
               el.style.display === 'none';
      },
      onclone: (clonedDoc, clonedElement) => {
        this.optimizeClonedElement(clonedDoc, clonedElement);
      }
    });
  }

  private async captureWithCloning(element: HTMLElement): Promise<HTMLCanvasElement> {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.zIndex = '-1000';
    document.body.appendChild(clone);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      return await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
    } finally {
      document.body.removeChild(clone);
    }
  }

  private async captureWithForceRender(element: HTMLElement): Promise<HTMLCanvasElement> {
    // Forçar re-renderização
    const originalDisplay = element.style.display;
    element.style.display = 'none';
    void element.offsetHeight;
    element.style.display = originalDisplay;
    void element.offsetHeight;

    await new Promise(resolve => setTimeout(resolve, 1000));

    return html2canvas(element, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      height: element.scrollHeight,
      width: element.scrollWidth
    });
  }

  private optimizeClonedElement(doc: Document, element: HTMLElement): void {
    // Remover elementos problemáticos
    const problematicSelectors = [
      '[aria-hidden="true"]',
      '.MuiSelect-nativeInput',
      '.MuiBackdrop-root',
      '.MuiModal-backdrop',
      'input[type="hidden"]',
      '.MuiTooltip-popper',
      '[data-testid]'
    ];

    problematicSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Otimizar estilos para captura
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      const htmlEl = el as HTMLElement;

      // Remover animações
      htmlEl.style.animation = 'none';
      htmlEl.style.transition = 'none';
      htmlEl.style.transform = 'none';

      // Garantir visibilidade
      if (htmlEl.style.opacity === '0') {
        htmlEl.style.opacity = '1';
      }

      // Corrigir fundos transparentes
      if (htmlEl.classList.toString().includes('chart') ||
          htmlEl.classList.toString().includes('recharts')) {
        htmlEl.style.backgroundColor = '#ffffff';
      }
    });

    // Forçar fundo branco no elemento raiz
    element.style.backgroundColor = '#ffffff';
  }

  private validateCanvas(canvas: HTMLCanvasElement, elementId: string): boolean {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.warn(`   ❌ Canvas inválido: ${elementId}`);
      return false;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Verificar área de amostragem maior
      const sampleWidth = Math.min(200, canvas.width);
      const sampleHeight = Math.min(200, canvas.height);
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = imageData.data;

      let nonWhitePixels = 0;
      let totalPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        totalPixels++;

        // Considerar como conteúdo se não for branco puro
        if (a > 0 && (r < 245 || g < 245 || b < 245)) {
          nonWhitePixels++;
        }
      }

      const contentPercentage = (nonWhitePixels / totalPixels) * 100;
      console.log(`   📊 Conteúdo detectado: ${contentPercentage.toFixed(1)}% (${elementId})`);

      return contentPercentage >= 0.5; // Reduzir threshold
    } catch (error) {
      console.warn(`   ❌ Erro na validação: ${elementId}`, error);
      return false;
    }
  }

  private addChartToPDFWithStyle(canvas: HTMLCanvasElement, elementId: string): void {
    const sectionTitle = this.getSectionTitle(elementId);
    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 120;

    // Calcular dimensões
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Verificar se precisa de nova página
    if (this.currentY + imgHeight + 45 > this.pageHeight - 30) {
      this.addNewPage();
    }

    // Cabeçalho da seção com estilo
    if (sectionTitle) {
      // Fundo do título
      this.doc.setFillColor(...this.colors.light);
      this.doc.rect(this.margin - 5, this.currentY - 3, maxWidth + 10, 18, 'F');

      // Barra lateral colorida
      this.doc.setFillColor(...this.colors.accent);
      this.doc.rect(this.margin - 5, this.currentY - 3, 4, 18, 'F');

      // Ícone e título
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.setTextColor(...this.colors.primary);
      this.doc.text(sectionTitle, this.margin + 5, this.currentY + 8);

      this.currentY += 25;
    }

    // Centralizar imagem
    const xOffset = (maxWidth - imgWidth) / 2;

    // Sombra do gráfico
    this.doc.setFillColor(200, 200, 200, 0.3);
    this.doc.rect(this.margin + xOffset + 2, this.currentY + 2, imgWidth, imgHeight, 'F');

    // Borda do gráfico
    this.doc.setDrawColor(...this.colors.secondary);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 0.95);
    this.doc.addImage(imgData, 'PNG', this.margin + xOffset, this.currentY, imgWidth, imgHeight);

    this.currentY += imgHeight + 20;
  }

  private getSectionTitle(elementId: string): string {
    const titles: Record<string, string> = {
      'kpi-metrics': '📊 Indicadores Chave de Performance (KPIs)',
      'maintenance-chart': '📈 Análise de Manutenção por Período',
      'heatmap-chart': '🔥 Mapa de Calor - Padrão de Chamados',
      'work-order-trend': '📋 Tendência de Ordens de Serviço',
      'response-time-trend': '⏱️ Tempo Médio de Primeira Resposta',
      'causa-chart': '🔍 Top 10 Ordens de Serviço por Causa',
      'familia-chart': '🏥 Top 10 Ordens de Serviço por Família',
      'tipo-manutencao-chart': '🔧 Top 10 por Tipo de Manutenção',
      'setor-chart': '🏢 Top 10 Ordens de Serviço por Setor',
      'taxa-cumprimento-chart': '✅ Taxa de Cumprimento de OS Planejadas',
      'equipment-count-chart': '📊 Top 10 Equipamentos por Quantidade',
      'distribuicao-prioridade-chart': '🎯 Distribuição por Prioridade'
    };
    return titles[elementId] || elementId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = 30;
  }

  private addModernFooter(): void {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      const footerY = this.pageHeight - 20;

      // Linha superior do rodapé
      this.doc.setDrawColor(...this.colors.primary);
      this.doc.setLineWidth(1);
      this.doc.line(this.margin, footerY - 8, this.pageWidth - this.margin, footerY - 8);

      // Fundo do rodapé
      this.doc.setFillColor(...this.colors.light);
      this.doc.rect(0, footerY - 7, this.pageWidth, 27, 'F');

      // Conteúdo do rodapé
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(...this.colors.primary);

      // Esquerda - Nome do sistema
      this.doc.text('GCINFRA 360º', this.margin, footerY);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...this.colors.text);
      this.doc.text('Sistema de Gestão de Infraestrutura Hospitalar', this.margin, footerY + 5);

      // Centro - Status
      const centerText = 'DOCUMENTO CONFIDENCIAL';
      const centerX = (this.pageWidth - this.doc.getTextWidth(centerText)) / 2;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...this.colors.accent);
      this.doc.text(centerText, centerX, footerY + 2.5);

      // Direita - Página e data
      const pageText = `Página ${i} de ${pageCount}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9);
      this.doc.setTextColor(...this.colors.primary);
      this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY);

      const dateText = new Date().toLocaleDateString('pt-BR');
      const dateWidth = this.doc.getTextWidth(dateText);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(dateText, this.pageWidth - this.margin - dateWidth, footerY + 5);
    }
  }

  private showModernProgress(): void {
    const overlay = document.createElement('div');
    overlay.id = 'modern-pdf-progress';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg,
        rgba(25, 118, 210, 0.95) 0%,
        rgba(33, 150, 243, 0.95) 50%,
        rgba(255, 193, 7, 0.95) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      backdrop-filter: blur(20px);
    `;

    overlay.innerHTML = `
      <div style="
        text-align: center;
        background: rgba(255,255,255,0.15);
        padding: 60px 80px;
        border-radius: 25px;
        backdrop-filter: blur(30px);
        border: 2px solid rgba(255,255,255,0.2);
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 500px;
      ">
        <div style="font-size: 64px; margin-bottom: 25px; animation: pulse 2s infinite;">📊</div>
        <h1 style="margin: 0 0 15px; font-size: 32px; font-weight: 700; letter-spacing: 2px;">GCINFRA 360º</h1>
        <h2 style="margin: 0 0 25px; font-size: 18px; font-weight: 400; opacity: 0.9;">Gerando Relatório Profissional</h2>
        <p id="modern-progress-status" style="margin: 0 0 20px; font-size: 16px; opacity: 0.8;">Preparando captura de alta qualidade...</p>
        <div style="
          width: 400px;
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          margin: 30px auto;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        ">
          <div id="modern-progress-bar" style="
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #fff, #f0f9ff);
            border-radius: 4px;
            transition: width 0.4s ease;
            box-shadow: 0 0 15px rgba(255,255,255,0.6);
          "></div>
        </div>
        <p style="margin: 20px 0 0; font-size: 14px; opacity: 0.7;">
          ✨ Captura otimizada • 🎨 Design moderno • 📱 Layout responsivo
        </p>
      </div>
    `;

    // Adicionar animação CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  }

  private updateProgress(current: number, total: number, elementId: string): void {
    const progressEl = document.getElementById('modern-progress-status');
    const barEl = document.getElementById('modern-progress-bar');

    if (progressEl && barEl) {
      const sectionName = this.getSectionTitle(elementId).replace(/^[📊📈🔥📋⏱️🔍🏥🔧🏢✅🎯]\s*/, '');
      const percentage = Math.round(((current) / total) * 100);

      progressEl.textContent = `Processando: ${sectionName} (${current}/${total})`;
      barEl.style.width = `${percentage}%`;
    }
  }

  private hideProgress(): void {
    const overlay = document.getElementById('modern-pdf-progress');
    if (overlay) {
      overlay.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.9)';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        // Remover estilo também
        const style = document.querySelector('style');
        if (style && style.textContent?.includes('pulse')) {
          document.head.removeChild(style);
        }
      }, 600);
    }
  }

  public async exportToPDF(options: ModernPDFOptions): Promise<void> {
    try {
      console.log('🚀 [EXPORTADOR MODERNO] Iniciando...');

      this.showModernProgress();

      // Carregar logo com fallback
      console.log('📸 Carregando logo...');
      await this.loadLogoWithFallback();

      // Adicionar cabeçalho moderno
      console.log('🎨 Criando cabeçalho...');
      this.addModernHeader(options);

      // Adicionar filtros estilizados
      console.log('🔍 Adicionando filtros...');
      this.addStylizedFiltersSection(options.filters);

      // Capturar gráficos
      console.log('📊 Iniciando captura de gráficos...');
      let capturedCount = 0;
      const results: Array<{id: string, success: boolean}> = [];

      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];
        this.updateProgress(i + 1, options.elementIds.length, elementId);

        const canvas = await this.captureElementAdvanced(elementId);
        if (canvas) {
          this.addChartToPDFWithStyle(canvas, elementId);
          capturedCount++;
          results.push({id: elementId, success: true});
        } else {
          results.push({id: elementId, success: false});
        }
      }

      // Adicionar rodapé moderno
      console.log('📝 Finalizando com rodapé...');
      this.addModernFooter();

      // Gerar arquivo
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `GCINFRA_360_Dashboard_Moderno_${timestamp}.pdf`;

      this.hideProgress();
      this.doc.save(filename);

      // Relatório final
      console.log(`\n🎉 [RELATÓRIO FINAL]`);
      console.log(`✅ Gráficos capturados: ${capturedCount}/${options.elementIds.length}`);
      console.log(`📄 Páginas geradas: ${this.pageNumber}`);
      console.log(`📁 Arquivo: ${filename}`);

      // Mostrar resultados detalhados
      results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.id}`);
      });

      // Notificação de sucesso
      this.showModernNotification(capturedCount, options.elementIds.length, filename);

    } catch (error) {
      this.hideProgress();
      console.error('💥 [ERRO CRÍTICO]:', error);
      throw error;
    }
  }

  private showModernNotification(captured: number, total: number, filename: string): void {
    const isFullSuccess = captured === total;
    const notification = document.createElement('div');

    notification.style.cssText = `
      position: fixed;
      top: 30px;
      right: 30px;
      background: ${isFullSuccess
        ? 'linear-gradient(135deg, #4caf50, #66bb6a)'
        : 'linear-gradient(135deg, #ff9800, #ffb74d)'};
      color: white;
      padding: 25px 35px;
      border-radius: 15px;
      font-family: 'Segoe UI', sans-serif;
      font-weight: 500;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10001;
      max-width: 450px;
      line-height: 1.5;
      animation: slideInRight 0.5s ease;
      border: 2px solid rgba(255,255,255,0.2);
    `;

    const icon = isFullSuccess ? '🎉' : '⚠️';
    const status = isFullSuccess ? 'Relatório gerado com sucesso!' : 'Relatório gerado com ressalvas';

    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 24px; margin-right: 10px;">${icon}</span>
        <strong style="font-size: 16px;">${status}</strong>
      </div>
      <div style="font-size: 14px; opacity: 0.95;">
        📄 <strong>Arquivo:</strong> ${filename}<br>
        📊 <strong>Gráficos:</strong> ${captured}/${total} capturados<br>
        🎨 <strong>Design:</strong> Layout moderno aplicado
      </div>
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

    // Remover após 8 segundos
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideInRight 0.5s ease reverse';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 500);
      }
    }, 8000);
  }
}

// Função principal de exportação
export async function exportModernPDF(options: ModernPDFOptions): Promise<void> {
  const exporter = new ModernPDFExporter();
  await exporter.exportToPDF(options);
}

// Função de teste
export function testModernPDF() {
  console.log('🧪 [TESTE MODERNO] Iniciando teste completo...');

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

  const availableIds = allPossibleIds.filter(id => {
    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    return false;
  });

  console.log(`📊 Elementos detectados: ${availableIds.length}/${allPossibleIds.length}`);
  availableIds.forEach((id, index) => {
    console.log(`   ${index + 1}. ✅ ${id}`);
  });

  const missingIds = allPossibleIds.filter(id => !availableIds.includes(id));
  if (missingIds.length > 0) {
    console.log(`❌ Elementos não encontrados: ${missingIds.length}`);
    missingIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ❌ ${id}`);
    });
  }

  if (availableIds.length === 0) {
    alert('❌ Nenhum gráfico foi detectado na página!\n\nCertifique-se de que o dashboard está carregado e os gráficos estão visíveis.');
    return;
  }

  exportModernPDF({
    title: 'Dashboard de Manutenção - Teste Moderno',
    subtitle: 'Relatório de Teste com Design Atualizado',
    companyName: 'Empresa de Teste',
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    filters: {
      periodo: 'Últimos 12 meses',
      empresa: 'Empresa de Teste',
      status: 'Todos os status',
      prioridade: 'Todas as prioridades'
    },
    elementIds: availableIds,
    filename: `Teste_Dashboard_Moderno_${new Date().toISOString().split('T')[0]}.pdf`
  }).then(() => {
    console.log('🎉 Teste concluído com sucesso!');
  }).catch(error => {
    console.error('💥 Teste falhou:', error);
  });
}

// Disponibilizar no console para testes
if (typeof window !== 'undefined') {
  (window as unknown as {
    testModernPDF: typeof testModernPDF;
    exportModernPDF: typeof exportModernPDF;
  }).testModernPDF = testModernPDF;
  (window as unknown as {
    testModernPDF: typeof testModernPDF;
    exportModernPDF: typeof exportModernPDF;
  }).exportModernPDF = exportModernPDF;
}