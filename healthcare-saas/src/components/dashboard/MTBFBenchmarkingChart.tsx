'use client'

import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Chip, useTheme } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'
import Plot from 'react-plotly.js'

interface MTBFCompanyData {
  empresa: string
  mtbf: number
}

interface MTBFFamiliaData {
  familia: string
  mtbf: number
}

interface MTBFData {
  byCompany: MTBFCompanyData[]
  topFamilias: MTBFFamiliaData[]
  bottomFamilias: MTBFFamiliaData[]
  companyStats: {
    empresa: string
    highestMTBF: { familia: string; mtbf: number } | null
    lowestMTBF: { familia: string; mtbf: number } | null
  }[]
}

interface Props {
  data: MTBFData
  loading: boolean
}

export default function MTBFBenchmarkingChart({ data, loading }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Função para formatar números grandes
  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toFixed(0)
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Análise MTBF por Empresa e Família
          </Typography>
          <Typography color="text.secondary">Carregando...</Typography>
        </CardContent>
      </Card>
    )
  }

  // Company MTBF bar chart
  const companyBarData = [
    {
      x: data.byCompany.map(item => item.empresa),
      y: data.byCompany.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'MTBF por Empresa',
      marker: {
        color: theme.palette.primary.main,
        line: { width: 0 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Top Famílias
  const topFamiliasData = [
    {
      x: data.topFamilias.map(item => item.familia),
      y: data.topFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Maiores MTBF',
      marker: {
        color: theme.palette.success.main,
        line: { width: 0 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Bottom Famílias
  const bottomFamiliasData = [
    {
      x: data.bottomFamilias.map(item => item.familia),
      y: data.bottomFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Menores MTBF',
      marker: {
        color: theme.palette.error.main,
        line: { width: 0 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Layout base
  const baseLayout = {
    font: { 
      family: 'Roboto, sans-serif', 
      size: 12, 
      color: theme.palette.text.secondary 
    },
    showlegend: false,
    margin: { l: 60, r: 20, t: 20, b: 80 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 300,
    xaxis: {
      tickangle: -45,
      tickfont: { 
        size: 11, 
        color: theme.palette.text.secondary
      },
      showgrid: false,
      showline: true,
      linecolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      linewidth: 1,
      automargin: true
    },
    yaxis: {
      title: {
        text: 'MTBF (horas)',
        font: { 
          size: 12, 
          color: theme.palette.text.secondary
        }
      },
      showgrid: true,
      gridcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      gridwidth: 1,
      showline: false,
      tickfont: { 
        size: 11, 
        color: theme.palette.text.secondary
      },
      automargin: true
    },
    hovermode: 'closest' as const,
    hoverlabel: {
      bgcolor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
      bordercolor: theme.palette.divider,
      font: { 
        color: theme.palette.text.primary,
        size: 11
      }
    }
  }

  const config = {
    displayModeBar: false,
    responsive: true
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Análise MTBF por Empresa e Família
        </Typography>
        
        <Grid container spacing={3}>
          {/* Company MTBF Bar Chart */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom>
              MTBF por Empresa
            </Typography>
            {data.byCompany.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={companyBarData}
                  layout={baseLayout}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhum dado disponível para empresas
              </Typography>
            )}
          </Grid>

          {/* Top Familias MTBF */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top 5 Maiores MTBF por Família
            </Typography>
            {data.topFamilias.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={topFamiliasData}
                  layout={baseLayout}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhum dado disponível
              </Typography>
            )}
          </Grid>

          {/* Bottom Familias MTBF */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" gutterBottom>
              Top 5 Menores MTBF por Família
            </Typography>
            {data.bottomFamilias.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={bottomFamiliasData}
                  layout={baseLayout}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhum dado disponível
              </Typography>
            )}
          </Grid>

          {/* Company Stats Cards */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" gutterBottom>
              Estatísticas por Empresa
            </Typography>
            <Grid container spacing={2}>
              {data.companyStats.map((company) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={company.empresa}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {company.empresa}
                      </Typography>
                      
                      {company.highestMTBF && (
                        <Box mb={2}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <TrendingUp color="success" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Maior MTBF:
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="success.main" mb={1}>
                            {formatValue(company.highestMTBF.mtbf)}h
                          </Typography>
                          <Chip
                            label={company.highestMTBF.familia}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}
                      
                      {company.lowestMTBF && (
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <TrendingDown color="error" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Menor MTBF:
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="error.main" mb={1}>
                            {formatValue(company.lowestMTBF.mtbf)}h
                          </Typography>
                          <Chip
                            label={company.lowestMTBF.familia}
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}