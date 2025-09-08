'use client'

import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import Plot from 'react-plotly.js'

interface EquipmentCountData {
  empresa: string
  equipmentCount: number
  percentage: number
}

interface Props {
  data: EquipmentCountData[]
  loading: boolean
}

export default function EquipmentCountByCompanyChart({ data, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quantidade de Equipamentos por Unidade
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

  const plotData = [
    {
      values: data.map(item => item.equipmentCount),
      labels: data.map(item => item.empresa),
      type: 'pie' as const,
      hole: 0.4,
      marker: {
        colors: colors.slice(0, data.length),
        line: {
          color: '#FFFFFF',
          width: 2
        }
      },
      textinfo: 'label+percent',
      textposition: 'auto' as const,
      hovertemplate: '<b>%{label}</b><br>' +
                     'Equipamentos: %{value}<br>' +
                     'Percentual: %{percent}<br>' +
                     '<extra></extra>',
    }
  ]

  const layout = {
    title: {
      text: '',
      font: { size: 16, color: '#333' }
    },
    font: { family: 'Roboto, sans-serif', size: 12 },
    showlegend: true,
    legend: {
      orientation: 'v' as const,
      x: 1.05,
      y: 0.5,
      xanchor: 'left' as const,
      yanchor: 'middle' as const
    },
    margin: { l: 20, r: 150, t: 50, b: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 400
  }

  const config = {
    displayModeBar: false,
    responsive: true
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quantidade de Equipamentos por Unidade
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Somente contados equipamentos que possuem alguma OS no intervalo de tempo selecionado
        </Typography>
        
        {data.length > 0 ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <Plot
              data={plotData}
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
      </CardContent>
    </Card>
  )
}