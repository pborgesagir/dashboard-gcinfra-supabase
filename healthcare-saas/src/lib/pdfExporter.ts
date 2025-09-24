import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ActiveFilter {
  label: string
  value: string
}

interface ExportOptions {
  title?: string
  subtitle?: string
  activeFilters?: ActiveFilter[]
  dataType?: 'clinical' | 'building'
  totalRecords?: number
}

const GCINFRA_COLORS = {
  primary: '#1976d2',
  secondary: '#42a5f5',
  accent: '#0d47a1',
  text: '#1a1a1a',
  lightText: '#666666',
  border: '#e0e0e0'
}

export class PDFExporter {
  private pdf: jsPDF
  private currentY: number = 0
  private pageWidth: number = 0
  private pageHeight: number = 0
  private margin: number = 20

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
  }

  private async addHeader(options: ExportOptions) {
    // Fundo do cabeçalho
    this.pdf.setFillColor(GCINFRA_COLORS.primary)
    this.pdf.rect(0, 0, this.pageWidth, 50, 'F')

    // Tentar carregar e adicionar o logo da empresa
    try {
      await this.addLogo()
    } catch (error) {
      console.log('Logo não pôde ser carregado:', error)
    }

    // Título principal
    this.pdf.setTextColor('#ffffff')
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(24)
    this.pdf.text('GCINFRA 360º', this.margin, 20)

    // Subtítulo
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'normal')
    const subtitleText = options.dataType === 'clinical'
      ? 'Dashboard - Engenharia Clínica'
      : options.dataType === 'building'
      ? 'Dashboard - Engenharia Predial'
      : 'Dashboard de Benchmarking'
    this.pdf.text(subtitleText, this.margin, 35)

    // Data de geração
    this.pdf.setFontSize(10)
    const now = new Date()
    const timestamp = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`
    const timestampWidth = this.pdf.getTextWidth(timestamp)
    this.pdf.text(timestamp, this.pageWidth - this.margin - timestampWidth, 45)

    this.currentY = 60
  }

  private async addLogo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'

      logoImg.onload = () => {
        try {
          // Adicionar logo no canto superior direito
          const logoWidth = 30
          const logoHeight = 30
          const logoX = this.pageWidth - this.margin - logoWidth
          const logoY = 10

          this.pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      logoImg.onerror = () => {
        reject(new Error('Erro ao carregar logo'))
      }

      // Tentar diferentes caminhos para o logo
      logoImg.src = '/logodaagir.png'

      // Timeout de 2 segundos para carregar o logo
      setTimeout(() => {
        reject(new Error('Timeout ao carregar logo'))
      }, 2000)
    })
  }

  private addFiltersSection(activeFilters: ActiveFilter[]) {
    if (activeFilters.length === 0) {
      // Seção sem filtros
      this.pdf.setTextColor(GCINFRA_COLORS.text)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setFontSize(14)
      this.pdf.text('Filtros Aplicados', this.margin, this.currentY)

      this.currentY += 10
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setFontSize(11)
      this.pdf.setTextColor(GCINFRA_COLORS.lightText)
      this.pdf.text('Nenhum filtro aplicado - exibindo todos os dados disponíveis', this.margin, this.currentY)

      this.currentY += 15
      return
    }

    // Título da seção
    this.pdf.setTextColor(GCINFRA_COLORS.text)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(14)
    this.pdf.text('Filtros Aplicados', this.margin, this.currentY)

    this.currentY += 8

    // Fundo da seção de filtros
    this.pdf.setFillColor(248, 249, 250)
    this.pdf.rect(this.margin, this.currentY - 5, this.pageWidth - (2 * this.margin),
                  (activeFilters.length * 6) + 10, 'F')

    // Listar filtros
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)
    this.pdf.setTextColor(GCINFRA_COLORS.text)

    activeFilters.forEach((filter, index) => {
      const yPos = this.currentY + (index * 6)

      // Label do filtro
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text(`${filter.label}:`, this.margin + 5, yPos)

      // Valor do filtro
      this.pdf.setFont('helvetica', 'normal')
      const labelWidth = this.pdf.getTextWidth(`${filter.label}: `)
      const maxValueWidth = this.pageWidth - this.margin - labelWidth - 30

      let value = filter.value
      if (this.pdf.getTextWidth(value) > maxValueWidth) {
        // Truncar texto se for muito longo
        while (this.pdf.getTextWidth(value + '...') > maxValueWidth && value.length > 0) {
          value = value.slice(0, -1)
        }
        value += '...'
      }

      this.pdf.text(value, this.margin + 5 + labelWidth, yPos)
    })

    this.currentY += (activeFilters.length * 6) + 15
  }

  private addSummaryInfo(totalRecords: number) {
    // Linha separadora
    this.pdf.setDrawColor(GCINFRA_COLORS.border)
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)

    this.currentY += 10

    // Título da seção
    this.pdf.setTextColor(GCINFRA_COLORS.text)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(14)
    this.pdf.text('Resumo dos Dados', this.margin, this.currentY)

    this.currentY += 10

    // Informações resumidas
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(11)
    this.pdf.text(`Total de registros filtrados: ${totalRecords.toLocaleString('pt-BR')}`, this.margin, this.currentY)

    this.currentY += 15
  }

  private checkPageBreak(requiredHeight: number = 50) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.pdf.addPage()
      this.currentY = this.margin
    }
  }

  async captureChart(elementId: string): Promise<void> {
    let element = document.getElementById(elementId)

    // Se não encontrou pelo ID, tenta encontrar por classe ou seletor mais genérico
    if (!element) {
      element = document.querySelector(`[id*="${elementId}"]`) as HTMLElement
    }

    if (!element) {
      console.warn(`Elemento ${elementId} não encontrado`)
      // Adicionar mensagem no PDF
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.setFontSize(10)
      this.pdf.setTextColor(200, 0, 0)
      this.pdf.text(`Gráfico não encontrado: ${elementId}`, this.margin, this.currentY)
      this.currentY += 15
      return
    }

    try {
      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0
      })

      // Calcular dimensões para o PDF
      const imgWidth = this.pageWidth - (2 * this.margin)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Verificar se precisa quebrar página
      this.checkPageBreak(imgHeight + 20)

      // Adicionar título do gráfico se houver
      const titleElement = element.querySelector('h6, .chart-title')
      if (titleElement) {
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(12)
        this.pdf.setTextColor(GCINFRA_COLORS.text)
        this.pdf.text(titleElement.textContent || '', this.margin, this.currentY)
        this.currentY += 10
      }

      // Adicionar imagem ao PDF
      const imgData = canvas.toDataURL('image/png', 0.9)
      this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight)

      this.currentY += imgHeight + 15

    } catch (error) {
      console.error(`Erro ao capturar ${elementId}:`, error)

      // Adicionar mensagem de erro no PDF
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.setFontSize(10)
      this.pdf.setTextColor(200, 0, 0)
      this.pdf.text(`Erro ao capturar gráfico: ${elementId}`, this.margin, this.currentY)
      this.currentY += 15
    }
  }

  async captureMultipleCharts(chartIds: string[]): Promise<void> {
    for (const chartId of chartIds) {
      await this.captureChart(chartId)
    }
  }

  private addFooter() {
    const pageCount = this.pdf.internal.pages.length - 1

    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)

      // Linha do rodapé
      this.pdf.setDrawColor(GCINFRA_COLORS.border)
      this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15)

      // Texto do rodapé
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setFontSize(8)
      this.pdf.setTextColor(GCINFRA_COLORS.lightText)

      // Esquerda - Sistema
      this.pdf.text('GCINFRA 360º - Sistema de Gestão de Manutenção', this.margin, this.pageHeight - 8)

      // Direita - Paginação
      const pageText = `Página ${i} de ${pageCount}`
      const pageTextWidth = this.pdf.getTextWidth(pageText)
      this.pdf.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 8)
    }
  }

  private findChartElements(): HTMLElement[] {
    const charts: HTMLElement[] = []

    // Buscar por IDs específicos primeiro
    const specificIds = [
      // IDs do dashboard de benchmarking
      'equipment-status-section',
      'equipment-count-chart',
      'company-status-gauges',
      'os-trend-chart',
      'completion-rate-trend',
      'response-time-trend',
      'mttr-trend-chart',
      'mtbf-benchmarking-chart',
      // IDs dos dashboards clinical e building
      'kpi-metrics',
      'maintenance-chart',
      'heatmap-chart',
      'work-order-trend',
      'response-time-trend',
      'taxa-cumprimento-chart',
      'causa-chart',
      'familia-chart',
      'tipo-manutencao-chart',
      'setor-chart'
    ]

    specificIds.forEach(id => {
      const element = document.getElementById(id)
      if (element && element.offsetHeight > 100) { // Só incluir se visível e com altura
        charts.push(element)
      }
    })

    // Se não encontrou gráficos específicos, buscar por padrões genéricos
    if (charts.length === 0) {
      const selectors = [
        '[id*="chart"]',
        '[class*="recharts"]',
        '.MuiCard-root:has(canvas)',
        '.MuiCard-root:has(svg)',
        '[data-chart="true"]'
      ]

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>
        elements.forEach(el => {
          if (el.offsetHeight > 100 && !charts.includes(el)) {
            charts.push(el)
          }
        })
      })
    }

    return charts
  }

  async generateDashboardPDF(options: ExportOptions): Promise<void> {
    // Adicionar cabeçalho
    await this.addHeader(options)

    // Adicionar seção de filtros
    if (options.activeFilters) {
      this.addFiltersSection(options.activeFilters)
    }

    // Adicionar informações de resumo
    if (options.totalRecords !== undefined) {
      this.addSummaryInfo(options.totalRecords)
    }

    // Encontrar gráficos automaticamente
    const chartElements = this.findChartElements()

    if (chartElements.length === 0) {
      // Se não encontrou nenhum gráfico, adicionar mensagem
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setFontSize(12)
      this.pdf.setTextColor(200, 0, 0)
      this.pdf.text('Nenhum gráfico foi encontrado para captura.', this.margin, this.currentY)
      this.currentY += 15
    } else {
      // Capturar cada gráfico encontrado
      for (const element of chartElements) {
        await this.captureElement(element)
      }
    }

    // Adicionar rodapé
    this.addFooter()
  }

  private async captureElement(element: HTMLElement): Promise<void> {
    try {
      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0
      })

      // Calcular dimensões para o PDF
      const imgWidth = this.pageWidth - (2 * this.margin)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Verificar se precisa quebrar página
      this.checkPageBreak(imgHeight + 20)

      // Adicionar título do gráfico se houver
      const titleElement = element.querySelector('h6, .chart-title, .MuiTypography-h6')
      if (titleElement) {
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(12)
        this.pdf.setTextColor(GCINFRA_COLORS.text)
        this.pdf.text(titleElement.textContent || '', this.margin, this.currentY)
        this.currentY += 10
      }

      // Adicionar imagem ao PDF
      const imgData = canvas.toDataURL('image/png', 0.9)
      this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight)

      this.currentY += imgHeight + 15

    } catch (error) {
      console.error('Erro ao capturar elemento:', error)

      // Adicionar mensagem de erro no PDF
      this.pdf.setFont('helvetica', 'italic')
      this.pdf.setFontSize(10)
      this.pdf.setTextColor(200, 0, 0)
      this.pdf.text('Erro ao capturar gráfico', this.margin, this.currentY)
      this.currentY += 15
    }
  }

  save(filename: string = 'dashboard-gcinfra-360.pdf'): void {
    // Garantir que o nome do arquivo termine com .pdf
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf'
    }

    this.pdf.save(filename)
  }
}