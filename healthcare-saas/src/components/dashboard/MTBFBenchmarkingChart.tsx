'use client'

import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material'
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
  if (loading) {
    return (
      <Card elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} fontFamily="'Inter', sans-serif">
            Análise MTBF por Empresa e Família
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontFamily: "'Inter', sans-serif" }}>
            Carregando...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Função para formatar números grandes
  const formatValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toFixed(0)
  }

  // Paleta de cores moderna e profissional
  const colors = {
    primary: '#6366f1',      // Índigo moderno
    secondary: '#8b5cf6',    // Violeta
    accent: '#06b6d4',       // Cyan
    success: '#10b981',      // Verde esmeralda
    warning: '#f59e0b',      // Âmbar
    error: '#ef4444',        // Vermelho moderno
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  }

  // Company MTBF bar chart com gradiente sutil
  const companyBarData = [
    {
      x: data.byCompany.map(item => item.empresa),
      y: data.byCompany.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'MTBF por Empresa',
      marker: {
        color: colors.primary,
        line: { width: 0 },
        // Barras com cantos arredondados via CSS
        pattern: { shape: '' }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>',
      textposition: 'outside',
      textfont: {
        family: "'Inter', sans-serif",
        size: 11,
        color: colors.neutral[600]
      }
    }
  ]

  // Top Famílias com cor de sucesso
  const topFamiliasData = [
    {
      x: data.topFamilias.map(item => item.familia),
      y: data.topFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Maiores MTBF',
      marker: {
        color: colors.success,
        line: { width: 0 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Bottom Famílias com cor de erro
  const bottomFamiliasData = [
    {
      x: data.bottomFamilias.map(item => item.familia),
      y: data.bottomFamilias.map(item => item.mtbf),
      type: 'bar' as const,
      name: 'Menores MTBF',
      marker: {
        color: colors.error,
        line: { width: 0 }
      },
      hovertemplate: '<b>%{x}</b><br>' +
                     'MTBF: %{y:,.1f} horas<br>' +
                     '<extra></extra>'
    }
  ]

  // Layout moderno e limpo
  const createLayout = (yAxisTitle: string) => ({
    font: { 
      family: "'Inter', sans-serif", 
      size: 12, 
      color: colors.neutral[600] 
    },
    showlegend: false,
    margin: { l: 70, r: 20, t: 20, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 280,
    xaxis: {
      tickangle: -45,
      tickfont: { 
        size: 11, 
        color: colors.neutral[500],
        family: "'Inter', sans-serif"
      },
      showgrid: false,
      showline: true,
      linecolor: colors.neutral[200],
      linewidth: 1
    },
    yaxis: {
      title: {
        text: yAxisTitle,
        font: { 
          size: 12, 
          color: colors.neutral[600],
          family: "'Inter', sans-serif"
        }
      },
      showgrid: true,
      gridcolor: colors.neutral[100],
      gridwidth: 1,
      showline: false,
      tickfont: { 
        size: 11, 
        color: colors.neutral[500],
        family: "'Inter', sans-serif"
      },
      tickformat: '',
      tickmode: 'linear'
    },
    hovermode: 'closest' as const,
    hoverlabel: {
      bgcolor: colors.neutral[800],
      bordercolor: colors.neutral[700],
      font: { 
        color: 'white', 
        family: "'Inter', sans-serif",
        size: 12
      }
    }
  })

  const config = {
    displayModeBar: false,
    responsive: true
  }

  // Componente de estatística moderna
  const StatCard = ({ 
    company, 
    label, 
    value, 
    familia, 
    isHighest 
  }: { 
    company: string
    label: string
    value: number
    familia: string
    isHighest: boolean 
  }) => (
    <Card 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        border: `1px solid ${colors.neutral[200]}`,
        borderRadius: 2.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: colors.primary,
          boxShadow: `0 4px 12px ${colors.primary}15`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography 
            variant="h6" 
            fontWeight={600}
            fontFamily="'Inter', sans-serif"
            color="text.primary"
          >
            {company}
          </Typography>
          {isHighest ? (
            <TrendingUp sx={{ color: colors.success, fontSize: 20 }} />
          ) : (
            <TrendingDown sx={{ color: colors.error, fontSize: 20 }} />
          )}
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary"
          fontFamily="'Inter', sans-serif"
          mb={1}
          fontWeight={500}
        >
          {label}
        </Typography>

        <Typography 
          variant="h4" 
          fontWeight={700}
          fontFamily="'Inter', sans-serif"
          color={isHighest ? colors.success : colors.error}
          mb={1}
        >
          {formatValue(value)}h
        </Typography>

        <Chip
          label={familia}
          size="small"
          sx={{
            bgcolor: isHighest ? `${colors.success}15` : `${colors.error}15`,
            color: isHighest ? colors.success : colors.error,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
            border: `1px solid ${isHighest ? colors.success : colors.error}25`
          }}
        />
      </CardContent>
    </Card>
  )

  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header moderno */}
        <Box mb={4}>
          <Typography 
            variant="h5" 
            fontWeight={600}
            fontFamily="'Inter', sans-serif"
            color="text.primary"
            gutterBottom
          >
            Análise MTBF por Empresa e Família
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            fontFamily="'Inter', sans-serif"
          >
            Mean Time Between Failures - Indicadores de confiabilidade por empresa e família de equipamentos
          </Typography>
        </Box>
        
        {/* Layout em grid otimizado */}
        <Grid container spacing={4}>
          {/* Gráfico principal - MTBF por Empresa */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box mb={3}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                color="text.primary"
                gutterBottom
              >
                MTBF por Empresa
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                fontFamily="'Inter', sans-serif"
              >
                Comparativo do tempo médio entre falhas
              </Typography>
            </Box>
            
            {data.byCompany.length > 0 ? (
              <Box 
                sx={{ 
                  height: 280,
                  bgcolor: colors.neutral[50],
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Plot
                  data={companyBarData}
                  layout={createLayout('MTBF (horas)')}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: colors.neutral[50],
                  borderRadius: 2
                }}
              >
                <Typography 
                  color="text.secondary" 
                  fontFamily="'Inter', sans-serif"
                >
                  Nenhum dado disponível para empresas
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Cards de estatísticas modernos */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box mb={3}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                color="text.primary"
                gutterBottom
              >
                Destaques por Empresa
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                fontFamily="'Inter', sans-serif"
              >
                Maior e menor MTBF por família
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {data.companyStats.slice(0, 4).map((company) => (
                <React.Fragment key={company.empresa}>
                  {company.highestMTBF && (
                    <Grid size={{ xs: 12 }}>
                      <StatCard
                        company={company.empresa}
                        label="Maior MTBF"
                        value={company.highestMTBF.mtbf}
                        familia={company.highestMTBF.familia}
                        isHighest={true}
                      />
                    </Grid>
                  )}
                  {company.lowestMTBF && (
                    <Grid size={{ xs: 12 }}>
                      <StatCard
                        company={company.empresa}
                        label="Menor MTBF"
                        value={company.lowestMTBF.mtbf}
                        familia={company.lowestMTBF.familia}
                        isHighest={false}
                      />
                    </Grid>
                  )}
                </React.Fragment>
              ))}
            </Grid>
          </Grid>

          {/* Gráficos de famílias lado a lado */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box mb={3}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                color="text.primary"
                gutterBottom
              >
                Top 5 Maiores MTBF
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                fontFamily="'Inter', sans-serif"
              >
                Famílias com melhor confiabilidade
              </Typography>
            </Box>
            
            {data.topFamilias.length > 0 ? (
              <Box 
                sx={{ 
                  height: 280,
                  bgcolor: `${colors.success}08`,
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${colors.success}15`
                }}
              >
                <Plot
                  data={topFamiliasData}
                  layout={createLayout('MTBF (horas)')}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: colors.neutral[50],
                  borderRadius: 2
                }}
              >
                <Typography 
                  color="text.secondary" 
                  fontFamily="'Inter', sans-serif"
                >
                  Nenhum dado disponível
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box mb={3}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                fontFamily="'Inter', sans-serif"
                color="text.primary"
                gutterBottom
              >
                Top 5 Menores MTBF
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                fontFamily="'Inter', sans-serif"
              >
                Famílias que precisam de atenção
              </Typography>
            </Box>
            
            {data.bottomFamilias.length > 0 ? (
              <Box 
                sx={{ 
                  height: 280,
                  bgcolor: `${colors.error}08`,
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${colors.error}15`
                }}
              >
                <Plot
                  data={bottomFamiliasData}
                  layout={createLayout('MTBF (horas)')}
                  config={config}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            ) : (
              <Box 
                sx={{ 
                  height: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: colors.neutral[50],
                  borderRadius: 2
                }}
              >
                <Typography 
                  color="text.secondary" 
                  fontFamily="'Inter', sans-serif"
                >
                  Nenhum dado disponível
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}