import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WorkingPDFOptions {
  title: string;
  elementIds: string[];
  filename?: string;
}

export class WorkingPDFExporter {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;

    console.log('🔥 PDF WORKING EXPORTER INICIALIZADO');
    console.log(`📏 Dimensões: ${this.pageWidth}x${this.pageHeight}mm`);
  }

  private addWorkingHeader(): void {
    console.log('🎨 ADICIONANDO CABEÇALHO WORKING...');

    // FORÇA UM CABEÇALHO AZUL VISTOSO
    this.doc.setFillColor(0, 100, 200); // AZUL FORTE
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // TEXTO BRANCO GRANDE
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(255, 255, 255); // BRANCO
    this.doc.text('GCINFRA 360º - WORKING VERSION', 20, 25);

    // DATA
    const now = new Date();
    this.doc.setFontSize(12);
    this.doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')}`, 20, 35);

    this.currentY = 50;
    console.log('✅ Cabeçalho WORKING adicionado');
  }

  private addWorkingFooter(): void {
    console.log('📝 ADICIONANDO RODAPÉ WORKING...');

    const footerY = this.pageHeight - 20;

    // FUNDO CINZA
    this.doc.setFillColor(220, 220, 220);
    this.doc.rect(0, footerY - 5, this.pageWidth, 25, 'F');

    // TEXTO DO RODAPÉ
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 100, 200);
    this.doc.text('WORKING PDF EXPORTER - VERSÃO FUNCIONAL', 20, footerY + 5);

    console.log('✅ Rodapé WORKING adicionado');
  }

  private async captureElementWorking(elementId: string): Promise<HTMLCanvasElement | null> {
    console.log(`🎯 CAPTURANDO WORKING: ${elementId}`);

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ ELEMENTO NÃO ENCONTRADO: ${elementId}`);
      return null;
    }

    const rect = element.getBoundingClientRect();
    console.log(`📐 Dimensões: ${rect.width}x${rect.height}`);

    if (rect.width === 0 || rect.height === 0) {
      console.error(`❌ ELEMENTO COM DIMENSÕES ZERO: ${elementId}`);
      return null;
    }

    try {
      // AGUARDA 3 SEGUNDOS PARA GARANTIR RENDERIZAÇÃO
      console.log('⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('📸 Capturando com html2canvas...');
      const canvas = await html2canvas(element, {
        scale: 1,
        backgroundColor: '#ffffff',
        logging: true, // ATIVAR LOGS
        useCORS: true,
        allowTaint: true
      });

      console.log(`✅ Canvas criado: ${canvas.width}x${canvas.height}`);

      // VALIDAR SE TEM CONTEÚDO
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const hasContent = imageData.data.some(pixel => pixel < 250);
        console.log(`📊 Tem conteúdo: ${hasContent}`);

        if (!hasContent) {
          console.warn(`⚠️ Canvas vazio: ${elementId}`);
          return null;
        }
      }

      return canvas;

    } catch (error) {
      console.error(`💥 ERRO na captura: ${elementId}`, error);
      return null;
    }
  }

  private addCanvasToPDF(canvas: HTMLCanvasElement, elementId: string): void {
    console.log(`📄 ADICIONANDO AO PDF: ${elementId}`);

    const maxWidth = this.pageWidth - (2 * this.margin);
    const maxHeight = 80;

    // CALCULAR DIMENSÕES
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // VERIFICAR SE PRECISA DE NOVA PÁGINA
    if (this.currentY + imgHeight + 40 > this.pageHeight - 30) {
      console.log('📄 NOVA PÁGINA...');
      this.doc.addPage();
      this.addWorkingHeader();
    }

    // TÍTULO DO GRÁFICO
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 100, 200);
    this.doc.text(`GRÁFICO: ${elementId}`, this.margin, this.currentY);
    this.currentY += 15;

    // ADICIONAR IMAGEM
    const imgData = canvas.toDataURL('image/png', 1.0);
    this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
    this.currentY += imgHeight + 20;

    console.log(`✅ Gráfico adicionado: ${elementId}`);
  }

  public async exportToPDF(options: WorkingPDFOptions): Promise<void> {
    console.log('\n🚀 INICIANDO WORKING PDF EXPORT...');
    console.log(`📋 Elementos para capturar: ${options.elementIds.length}`);

    // MOSTRAR PROGRESS SIMPLES
    const overlay = document.createElement('div');
    overlay.id = 'working-progress';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 100, 200, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
    `;
    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚡</div>
        <div>WORKING PDF EXPORTER</div>
        <div style="font-size: 16px; margin-top: 10px;">Gerando PDF que funciona...</div>
        <div id="working-status" style="font-size: 14px; margin-top: 20px;">Preparando...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      // 1. ADICIONAR CABEÇALHO
      this.addWorkingHeader();

      // 2. PROCESSAR CADA ELEMENTO
      let successCount = 0;
      for (let i = 0; i < options.elementIds.length; i++) {
        const elementId = options.elementIds[i];

        // ATUALIZAR STATUS
        const statusEl = document.getElementById('working-status');
        if (statusEl) {
          statusEl.textContent = `Processando: ${elementId} (${i + 1}/${options.elementIds.length})`;
        }

        const canvas = await this.captureElementWorking(elementId);
        if (canvas) {
          this.addCanvasToPDF(canvas, elementId);
          successCount++;
          console.log(`✅ SUCESSO ${successCount}/${options.elementIds.length}`);
        } else {
          console.log(`❌ FALHOU ${i + 1}/${options.elementIds.length}`);
        }
      }

      // 3. ADICIONAR RODAPÉ EM TODAS AS PÁGINAS
      const pageCount = this.doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        this.doc.setPage(i);
        this.addWorkingFooter();
      }

      // 4. SALVAR
      const filename = options.filename || `WORKING_PDF_${new Date().getTime()}.pdf`;
      this.doc.save(filename);

      // REMOVER OVERLAY
      document.body.removeChild(overlay);

      console.log(`\n🎉 WORKING PDF CONCLUÍDO!`);
      console.log(`✅ Sucessos: ${successCount}/${options.elementIds.length}`);
      console.log(`📄 Páginas: ${pageCount}`);
      console.log(`📁 Arquivo: ${filename}`);

      // ALERTA DE SUCESSO
      alert(`🎉 WORKING PDF GERADO!\n\n✅ ${successCount}/${options.elementIds.length} gráficos\n📄 ${pageCount} páginas\n📁 ${filename}`);

    } catch (error) {
      document.body.removeChild(overlay);
      console.error('💥 ERRO WORKING:', error);
      alert(`❌ ERRO: ${error}`);
      throw error;
    }
  }
}

// FUNÇÃO PRINCIPAL
export async function exportWorkingPDF(options: WorkingPDFOptions): Promise<void> {
  const exporter = new WorkingPDFExporter();
  await exporter.exportToPDF(options);
}

// FUNÇÃO DE TESTE QUE FUNCIONA
export function testWorkingPDF() {
  console.log('\n🧪 TESTE WORKING PDF...');

  // BUSCAR ELEMENTOS REAIS
  const allIds = [
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

  const foundIds: string[] = [];

  allIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        foundIds.push(id);
        console.log(`✅ ENCONTRADO: ${id}`);
      } else {
        console.log(`⚠️ DIMENSÕES ZERO: ${id}`);
      }
    } else {
      console.log(`❌ NÃO ENCONTRADO: ${id}`);
    }
  });

  console.log(`\n📊 ELEMENTOS VÁLIDOS: ${foundIds.length}`);

  if (foundIds.length === 0) {
    alert('❌ NENHUM ELEMENTO VÁLIDO ENCONTRADO!');
    return;
  }

  // EXPORTAR COM ELEMENTOS ENCONTRADOS
  exportWorkingPDF({
    title: 'WORKING TEST',
    elementIds: foundIds,
    filename: `WORKING_TEST_${new Date().getTime()}.pdf`
  });
}

// DISPONIBILIZAR NO CONSOLE
if (typeof window !== 'undefined') {
  (window as unknown as {
    testWorkingPDF: typeof testWorkingPDF;
    exportWorkingPDF: typeof exportWorkingPDF;
  }).testWorkingPDF = testWorkingPDF;
  (window as unknown as {
    testWorkingPDF: typeof testWorkingPDF;
    exportWorkingPDF: typeof exportWorkingPDF;
  }).exportWorkingPDF = exportWorkingPDF;

  console.log('🔥 WORKING PDF EXPORTER CARREGADO!');
  console.log('💡 Use: testWorkingPDF() no console');
}