'use client'

import React from 'react'
import { Box, Typography, Grid, Card, CardContent } from '@mui/material'
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

  const createGaugeData = (company: CompanyStatusData) => {
    const abertaPercent = company.total > 0 ? (company.aberta / company.total) * 100 : 0
    const fechadaPercent = company.total > 0 ? (company.fechada / company.total) * 100 : 0
    const pendentePercent = company.total > 0 ? (company.pendente / company.total) * 100 : 0

    return [
      {
        domain: { x: [0, 1], y: [0.7, 1] },
        value: abertaPercent,
        title: { text: `<b>Abertas</b><br>${abertaPercent.toFixed(1)}%` },
        type: 'indicator' as const,
        mode: 'gauge+number' as const,
        gauge: {
          axis: { range: [null, 100] },
          bar: { color: '#f44336' },
          steps: [
            { range: [0, 50], color: 'lightgray' },
            { range: [50, 100], color: 'gray' }
          ],
          threshold: {
            line: { color: 'red', width: 4 },
            thickness: 0.75,
            value: 90
          }
        }
      },
      {
        domain: { x: [0, 1], y: [0.35, 0.65] },
        value: fechadaPercent,
        title: { text: `<b>Fechadas</b><br>${fechadaPercent.toFixed(1)}%` },
        type: 'indicator' as const,
        mode: 'gauge+number' as const,
        gauge: {
          axis: { range: [null, 100] },
          bar: { color: '#4caf50' },
          steps: [
            { range: [0, 50], color: 'lightgray' },
            { range: [50, 100], color: 'gray' }
          ],
          threshold: {
            line: { color: 'green', width: 4 },
            thickness: 0.75,
            value: 90
          }
        }
      },
      {
        domain: { x: [0, 1], y: [0, 0.3] },
        value: pendentePercent,
        title: { text: `<b>Pendentes</b><br>${pendentePercent.toFixed(1)}%` },
        type: 'indicator' as const,
        mode: 'gauge+number' as const,
        gauge: {
          axis: { range: [null, 100] },
          bar: { color: '#ff9800' },
          steps: [
            { range: [0, 50], color: 'lightgray' },
            { range: [50, 100], color: 'gray' }
          ],
          threshold: {
            line: { color: 'orange', width: 4 },
            thickness: 0.75,
            value: 90
          }
        }
      }
    ]
  }

  const layout = {
    font: { family: 'Roboto, sans-serif', size: 10 },
    showlegend: false,
    margin: { l: 20, r: 20, t: 20, b: 20 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    height: 300
  }

  const config = {
    displayModeBar: false,
    responsive: true
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Status das OS por Empresa
        </Typography>
        
        {data.length > 0 ? (
          <Grid container spacing={2}>
            {data.map((company) => (
              <Grid item xs={12} sm={6} md={4} key={company.empresa}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {company.empresa}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total: {company.total} OS
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <Plot
                    data={createGaugeData(company)}
                    layout={layout}
                    config={config}
                    style={{ width: '100%', height: '100%' }}
                  />
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