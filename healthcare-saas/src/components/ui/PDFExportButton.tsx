'use client'

import React, { useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  Alert
} from '@mui/material'
import { PictureAsPdf as PdfIcon } from '@mui/icons-material'
import { PDFExporter } from '../../lib/pdfExporter'

interface ActiveFilter {
  label: string
  value: string
}

interface PDFExportButtonProps {
  activeFilters: ActiveFilter[]
  dataType: 'clinical' | 'building'
  totalRecords: number
  disabled?: boolean
}

export default function PDFExportButton({
  activeFilters,
  dataType,
  totalRecords,
  disabled = false
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    setShowProgress(true)
    setProgress(0)
    setError(null)
    setProgressMessage('Iniciando exportação...')

    try {
      const exporter = new PDFExporter()

      // Simular progresso enquanto o PDF é gerado
      const progressSteps = [
        { message: 'Preparando documento...', progress: 10 },
        { message: 'Capturando métricas KPI...', progress: 20 },
        { message: 'Capturando gráficos de manutenção...', progress: 35 },
        { message: 'Capturando gráfico de calor...', progress: 45 },
        { message: 'Capturando tendências...', progress: 60 },
        { message: 'Capturando gráficos de análise...', progress: 80 },
        { message: 'Finalizando documento...', progress: 95 },
        { message: 'Download iniciado!', progress: 100 }
      ]

      let stepIndex = 0
      const updateProgress = () => {
        if (stepIndex < progressSteps.length) {
          const step = progressSteps[stepIndex]
          setProgressMessage(step.message)
          setProgress(step.progress)
          stepIndex++
          setTimeout(updateProgress, 500)
        }
      }

      updateProgress()

      // Gerar o PDF
      await exporter.generateDashboardPDF({
        title: 'Dashboard GCINFRA 360º',
        dataType,
        activeFilters,
        totalRecords
      })

      // Definir nome do arquivo
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
      const typeStr = dataType === 'clinical' ? 'clinica' : 'predial'
      const filename = `gcinfra-360-dashboard-${typeStr}-${dateStr}-${timeStr}.pdf`

      // Baixar o arquivo
      exporter.save(filename)

      // Aguardar um pouco para mostrar o progresso completo
      setTimeout(() => {
        setShowProgress(false)
        setIsExporting(false)
      }, 1000)

    } catch (err) {
      console.error('Erro ao exportar PDF:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar PDF')
      setIsExporting(false)
    }
  }

  const handleCloseDialog = () => {
    if (!isExporting) {
      setShowProgress(false)
      setError(null)
    }
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
        onClick={handleExport}
        disabled={disabled || isExporting}
        sx={{
          bgcolor: '#d32f2f',
          '&:hover': {
            bgcolor: '#b71c1c'
          },
          '&:disabled': {
            bgcolor: 'rgba(0, 0, 0, 0.12)'
          }
        }}
      >
        {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>

      <Dialog
        open={showProgress}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isExporting}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PdfIcon color="error" />
            <Typography variant="h6">
              Exportando Dashboard
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Erro na exportação:</strong> {error}
              </Typography>
            </Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gerando relatório em PDF com todos os gráficos e filtros aplicados...
              </Typography>

              <Box mt={2} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="primary">
                    {progressMessage}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#d32f2f',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>

              {progress === 100 && !error && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    PDF gerado com sucesso! O download deve iniciar automaticamente.
                  </Typography>
                </Alert>
              )}

              <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="caption" color="text.secondary">
                  <strong>Incluído no relatório:</strong><br />
                  • Métricas KPI principais<br />
                  • Todos os gráficos e visualizações<br />
                  • Filtros aplicados ({activeFilters.length} filtro{activeFilters.length !== 1 ? 's' : ''})<br />
                  • Total de {totalRecords.toLocaleString('pt-BR')} registros<br />
                  • Timestamp de geração
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {error && (
            <Button onClick={handleCloseDialog} color="primary">
              Fechar
            </Button>
          )}
          {!error && progress === 100 && (
            <Button onClick={handleCloseDialog} color="primary">
              Concluído
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}