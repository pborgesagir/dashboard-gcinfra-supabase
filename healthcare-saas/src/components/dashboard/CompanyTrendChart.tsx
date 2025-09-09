'use client'

import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import Plot from 'react-plotly.js'

interface CompanyTrendData extends Record<string, string | number> {
  month: string
  monthDisplay: string
}

interface Props {
  data: CompanyTrendData[]
  companies: string[]
  loading: boolean
  title: string
  yAxisTitle?: string
  showAverage?: boolean
}

export default function CompanyTrendChart({ data, companies, loading, title, yAxisTitle = 'Quantidade', showAverage = false }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
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

  const plotData = companies.map((company, index) => ({
    x: data.map(item => item.monthDisplay),
    y: data.map(item => Number(item[company]) || 0),
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    name: company,
    line: {
      color: colors[index % colors.length],
      width: 2
    },
    marker: {
      size: 6,
      color: colors[index % colors.length]
    },
    hovertemplate: `<b>${company}</b><br>` +
                   'Mês: %{x}<br>' +
                   `${yAxisTitle}: %{y}<br>` +
                   '<extra></extra>'
  }))

  // Add average line if requested
  if (showAverage && data.length > 0) {
    const averageData = data.map(item => {
      const values = companies.map(company => Number(item[company]) || 0)
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    })

    plotData.push({
      x: data.map(item => item.monthDisplay),
      y: averageData,
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Média',
      line: {
        color: '#000000',
        width: 3
      },
      marker: {
        size: 0,
        color: '#000000'
      },
      hovertemplate: '<b>Média</b><br>' +
                     'Mês: %{x}<br>' +
                     `${yAxisTitle}: %{y:.1f}<br>` +
                     '<extra></extra>'
    })
  }

  const layout = {
    title: {
      text: '',
      font: { size: 16, color: '#333' }
    },
    xaxis: {
      title: { text: 'Período' },
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)',
      zeroline: false
    },
    yaxis: {
      title: { text: yAxisTitle },
      showgrid: true,
      gridcolor: 'rgba(0,0,0,0.1)',
      zeroline: false
    },
    font: { family: 'Roboto, sans-serif', size: 12 },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      y: -0.2,
      x: 0.5,
      xanchor: 'center' as const
    },
    margin: { l: 60, r: 40, t: 40, b: 80 },
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
          {title}
        </Typography>
        
        {data.length > 0 && companies.length > 0 ? (
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