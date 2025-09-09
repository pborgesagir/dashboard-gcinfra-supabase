'use client'

import React from 'react'
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material'
import Plot from 'react-plotly.js'

interface CompanyStatusData {
  empresa: string
  aberta: number
  fechada: number
  pendente: number
  total: number
}

interface Props {
  data: CompanyStatusData[]
  loading: boolean
}

export default function CompanyStatusGauges({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status das OS por Empresa
          </Typography>
          <Typography color="text.secondary">Carregando...</Typography>
        </CardContent>
      </Card>
    )
  }

  const createDonutData = (company: CompanyStatusData) => {
    const values = [company.aberta, company.fechada, company.pendente]
    const labels = ['Abertas', 'Fechadas', 'Pendentes']
    const colors = ['#f44336', '#4caf50', '#ff9800']

    return [{
      values,
      labels,
      type: 'pie' as const,
      hole: 0.5, // Criar efeito donut com centro limpo
      marker: {
        colors,
        line: {
          color: '#ffffff',
          width: 2
        }
      },
      textinfo: 'none', // Remover texto das fatias
      hovertemplate: '<b>%{label}</b><br>' +
                     'Quantidade: %{value}<br>' +
                     'Porcentagem: %{percent}<br>' +
                     '<extra></extra>',
      showlegend: false
    }]
  }

  const layout = {
    font: { family: 'Roboto, sans-serif', size: 12 },
    showlegend: false,
    margin: { l: 10, r: 10, t: 10, b: 10 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 200,
    annotations: []
  }

  const config = {
    displayModeBar: false,
    responsive: true
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Abertas': return '#f44336'
      case 'Fechadas': return '#4caf50'
      case 'Pendentes': return '#ff9800'
      default: return '#gray'
    }
  }

  const createLegend = (company: CompanyStatusData) => {
    const statusData = [
      { label: 'Abertas', count: company.aberta, color: '#f44336' },
      { label: 'Fechadas', count: company.fechada, color: '#4caf50' },
      { label: 'Pendentes', count: company.pendente, color: '#ff9800' }
    ]

    return statusData.map((status) => {
      const percentage = company.total > 0 ? ((status.count / company.total) * 100).toFixed(1) : '0.0'
      return (
        <Box key={status.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: status.color,
              borderRadius: '50%',
              flexShrink: 0
            }}
          />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {status.label}
          </Typography>
          <Chip
            label={`${status.count} (${percentage}%)`}
            size="small"
            variant="outlined"
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              borderColor: status.color,
              color: status.color
            }}
          />
        </Box>
      )
    })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Status das OS por Empresa
        </Typography>
        
        {data.length > 0 ? (
          <Grid container spacing={3}>
            {data.slice(0, 6).map((company) => ( // Limitar a 6 empresas para melhor layout
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={company.empresa}>
                {/* Cabeçalho da empresa */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {company.empresa}
                  </Typography>
                  <Chip 
                    label={`${company.total} OS Total`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>

                {/* Gráfico de rosca */}
                <Box sx={{ height: 200, mb: 2 }}>
                  <Plot
                    data={createDonutData(company)}
                    layout={layout}
                    config={config}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box>

                {/* Legenda com contagem e porcentagem */}
                <Box>
                  {createLegend(company)}
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Nenhum dado disponível
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}