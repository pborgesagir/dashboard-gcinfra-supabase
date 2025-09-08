'use client'

import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material'
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

  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ]

  // Company MTBF bar chart
  const companyBarData = [
    {
      x: data.byCompany.map(item => item.empresa),
      y: data.byCompany.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'MTBF por Empresa',
      marker: {
        color: colors.slice(0, data.byCompany.length),
        line: {
          color: 'rgba(0,0,0,0.8)',
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Top 5 Familias MTBF
  const topFamiliasData = [
    {
      x: data.topFamilias.map(item => item.familia),
      y: data.topFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Top 5 Famílias (Maior MTBF)',
      marker: {
        color: '#4caf50',
        line: {
          color: 'rgba(0,0,0,0.8)',
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Bottom 5 Familias MTBF  
  const bottomFamiliasData = [
    {
      x: data.bottomFamilias.map(item => item.familia),
      y: data.bottomFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Top 5 Famílias (Menor MTBF)',
      marker: {
        color: '#f44336',
        line: {
          color: 'rgba(0,0,0,0.8)',
          width: 1
        }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  const layout = {
    font: { family: 'Roboto, sans-serif', size: 12 },
    showlegend: false,
    margin: { l: 60, r: 40, t: 40, b: 100 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 300,
    xaxis: {
      tickangle: -45
    },
    yaxis: {
      title: 'MTBF (horas)',
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)'
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
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              MTBF por Empresa
            </Typography>
            {data.byCompany.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={companyBarData}
                  layout={layout}
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
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Top 5 Maiores MTBF por Família
            </Typography>
            {data.topFamilias.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={topFamiliasData}
                  layout={layout}
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
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Top 5 Menores MTBF por Família
            </Typography>
            {data.bottomFamilias.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <Plot
                  data={bottomFamiliasData}
                  layout={layout}
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
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Estatísticas por Empresa
            </Typography>
            <Grid container spacing={2}>
              {data.companyStats.map((company) => (
                <Grid item xs={12} sm={6} md={4} key={company.empresa}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {company.empresa}
                      </Typography>
                      
                      {company.highestMTBF && (
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary">
                            Maior MTBF:
                          </Typography>
                          <Chip
                            label={`${company.highestMTBF.familia}: ${company.highestMTBF.mtbf.toFixed(1)}h`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      )}
                      
                      {company.lowestMTBF && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Menor MTBF:
                          </Typography>
                          <Chip
                            label={`${company.lowestMTBF.familia}: ${company.lowestMTBF.mtbf.toFixed(1)}h`}
                            color="error"
                            size="small"
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