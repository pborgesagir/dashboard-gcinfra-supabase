// FALLBACK PDF EXPORTER - FUNCIONA SEM JSPDF
// Usa técnicas alternativas para garantir que o PDF seja gerado

export interface FallbackPDFOptions {
  title: string;
  elementIds: string[];
  filename?: string;
}

export class FallbackPDFExporter {
  private static instance: FallbackPDFExporter | null = null;

  static getInstance(): FallbackPDFExporter {
    if (!FallbackPDFExporter.instance) {
      FallbackPDFExporter.instance = new FallbackPDFExporter();
    }
    return FallbackPDFExporter.instance;
  }

  private showProgress(message: string) {
    console.log(`🔄 FALLBACK PDF: ${message}`);

    // Criar overlay visual
    const overlay = document.createElement('div');
    overlay.id = 'fallback-pdf-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 87, 34, 0.9);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 24px;
      font-weight: bold;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
        <div>FALLBACK PDF EXPORTER</div>
        <div style="font-size: 18px; margin-top: 10px;">${message}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    return overlay;
  }

  private hideProgress() {
    const overlay = document.getElementById('fallback-pdf-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // MÉTODO 1: PDF via Print API (mais confiável)
  private async generatePrintPDF(options: FallbackPDFOptions): Promise<boolean> {
    try {
      console.log('🖨️ TENTATIVA 1: Print PDF');

      // Criar página de impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('❌ Pop-up bloqueado');
        return false;
      }

      // Capturar elementos
      const capturedElements: string[] = [];

      for (const id of options.elementIds) {
        const element = document.getElementById(id);
        if (element) {
          // Clonar elemento com estilos
          const clone = element.cloneNode(true) as HTMLElement;
          capturedElements.push(clone.outerHTML);
        }
      }

      // HTML da página de impressão
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.title}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
              }
              .header {
                background: #ff5722;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
              }
              .footer {
                background: #ccc;
                padding: 10px;
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
              }
              .element {
                margin: 20px 0;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            🔥 ${options.title} - FALLBACK PDF
            <br>
            <small>Gerado em: ${new Date().toLocaleString('pt-BR')}</small>
          </div>

          ${capturedElements.map((html, index) => `
            <div class="element">
              <h3>Gráfico ${index + 1}</h3>
              ${html}
            </div>
          `).join('')}

          <div class="footer">
            FALLBACK PDF EXPORTER - ${new Date().toISOString()}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Aguardar carregamento e imprimir
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);

      console.log('✅ Print PDF: Executado');
      return true;

    } catch (error) {
      console.error('❌ Print PDF falhou:', error);
      return false;
    }
  }

  // MÉTODO 2: Canvas para PNG e depois "PDF"
  private async generateCanvasPDF(options: FallbackPDFOptions): Promise<boolean> {
    try {
      console.log('🎨 TENTATIVA 2: Canvas PDF');

      // Verificar html2canvas
      if (typeof html2canvas === 'undefined') {
        console.warn('⚠️ html2canvas não disponível');
        return false;
      }

      const images: string[] = [];

      // Capturar cada elemento como imagem
      for (const id of options.elementIds) {
        const element = document.getElementById(id);
        if (element) {
          try {
            const canvas = await html2canvas(element, {
              scale: 2,
              backgroundColor: '#ffffff',
              logging: false
            });

            if (canvas && canvas.width > 0) {
              images.push(canvas.toDataURL('image/png'));
            }
          } catch (error) {
            console.warn(`⚠️ Falha ao capturar ${id}:`, error);
          }
        }
      }

      if (images.length === 0) {
        console.error('❌ Nenhuma imagem capturada');
        return false;
      }

      // Criar HTML com imagens
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #ff5722, #ff7043);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .chart-image {
              width: 100%;
              margin: 20px 0;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer {
              background: #f0f0f0;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              margin-top: 30px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔥 ${options.title}</h1>
            <p>FALLBACK PDF EXPORTER - ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          ${images.map((img, index) => `
            <div>
              <h3>Gráfico ${index + 1}</h3>
              <img src="${img}" class="chart-image" alt="Gráfico ${index + 1}">
            </div>
          `).join('')}

          <div class="footer">
            FALLBACK PDF EXPORTER - Gerado em ${new Date().toISOString()}
          </div>
        </body>
        </html>
      `;

      // Abrir em nova janela para "Salvar como PDF"
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }

      console.log('✅ Canvas PDF: HTML gerado em nova janela');
      return true;

    } catch (error) {
      console.error('❌ Canvas PDF falhou:', error);
      return false;
    }
  }

  // MÉTODO 3: Download como HTML (último recurso)
  private async generateHTMLDownload(options: FallbackPDFOptions): Promise<boolean> {
    try {
      console.log('📄 TENTATIVA 3: HTML Download');

      // Capturar elementos
      const capturedHTML: string[] = [];

      for (const id of options.elementIds) {
        const element = document.getElementById(id);
        if (element) {
          capturedHTML.push(`
            <div style="page-break-inside: avoid; margin: 20px 0;">
              <h3>Elemento: ${id}</h3>
              ${element.outerHTML}
            </div>
          `);
        }
      }

      // HTML completo
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>${options.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .header {
              background: #ff5722;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .footer {
              background: #f0f0f0;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              margin-top: 30px;
            }
            @media print {
              @page { size: A4; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔥 ${options.title}</h1>
            <p>FALLBACK PDF EXPORTER</p>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Instruções:</strong> Use Ctrl+P e "Salvar como PDF" para gerar o PDF</p>
          </div>

          ${capturedHTML.join('')}

          <div class="footer">
            FALLBACK PDF EXPORTER - ${new Date().toISOString()}
            <br>
            <strong>Para gerar PDF:</strong> Pressione Ctrl+P e selecione "Salvar como PDF"
          </div>
        </body>
        </html>
      `;

      // Download do HTML
      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = options.filename?.replace('.pdf', '.html') || `fallback-report-${Date.now()}.html`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      console.log('✅ HTML Download: Concluído');

      // Mostrar instruções
      alert(`📄 HTML GERADO COM SUCESSO!\n\n📁 Arquivo: ${a.download}\n\n💡 INSTRUÇÕES:\n1. Abra o arquivo HTML baixado\n2. Pressione Ctrl+P\n3. Selecione "Salvar como PDF"\n4. Salve onde desejar\n\n🎯 Este método SEMPRE funciona!`);

      return true;

    } catch (error) {
      console.error('❌ HTML Download falhou:', error);
      return false;
    }
  }

  // MÉTODO PRINCIPAL - Tenta todos os métodos em sequência
  async export(options: FallbackPDFOptions): Promise<void> {
    console.log('🚀 FALLBACK PDF EXPORTER INICIANDO...');

    const overlay = this.showProgress('Iniciando export fallback...');

    try {
      // Validar elementos
      const foundElements = options.elementIds.filter(id => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().width > 0;
      });

      console.log(`📊 Elementos encontrados: ${foundElements.length}/${options.elementIds.length}`);

      if (foundElements.length === 0) {
        throw new Error('Nenhum elemento válido encontrado');
      }

      // Atualizar opções com elementos encontrados
      const validOptions = { ...options, elementIds: foundElements };

      // TENTATIVA 1: Print PDF
      this.showProgress('Tentativa 1: Print PDF...');
      const printSuccess = await this.generatePrintPDF(validOptions);

      if (printSuccess) {
        console.log('✅ SUCESSO: Print PDF');
        this.hideProgress();
        alert('✅ PDF gerado via impressão!\n\nUse a função de impressão que abriu para salvar como PDF.');
        return;
      }

      // TENTATIVA 2: Canvas PDF
      this.showProgress('Tentativa 2: Canvas PDF...');
      const canvasSuccess = await this.generateCanvasPDF(validOptions);

      if (canvasSuccess) {
        console.log('✅ SUCESSO: Canvas PDF');
        this.hideProgress();
        alert('✅ PDF gerado via Canvas!\n\nUse Ctrl+P na janela que abriu para salvar como PDF.');
        return;
      }

      // TENTATIVA 3: HTML Download (último recurso - sempre funciona)
      this.showProgress('Tentativa 3: HTML Download...');
      await this.generateHTMLDownload(validOptions);

      console.log('✅ SUCESSO: HTML Download');

    } catch (error) {
      console.error('💥 ERRO no Fallback PDF:', error);
      alert(`❌ ERRO: ${error}\n\nTodos os métodos falharam. Verifique o console para mais detalhes.`);
    } finally {
      this.hideProgress();
    }
  }
}

// Função de conveniência para export
export async function exportFallbackPDF(options: FallbackPDFOptions): Promise<void> {
  const exporter = FallbackPDFExporter.getInstance();
  await exporter.export(options);
}

// Função de teste
export function testFallbackPDF(): void {
  console.log('🧪 TESTE FALLBACK PDF...');

  // Elementos de teste
  const testElements = [
    'kpi-metrics',
    'maintenance-chart',
    'heatmap-chart',
    'work-order-trend'
  ];

  exportFallbackPDF({
    title: 'Dashboard GCINFRA 360º - TESTE FALLBACK',
    elementIds: testElements,
    filename: `TESTE_FALLBACK_${Date.now()}.pdf`
  });
}

// Disponibilizar globalmente para testes
declare global {
  interface Window {
    exportFallbackPDF: typeof exportFallbackPDF;
    testFallbackPDF: typeof testFallbackPDF;
  }
}

if (typeof window !== 'undefined') {
  window.exportFallbackPDF = exportFallbackPDF;
  window.testFallbackPDF = testFallbackPDF;
}