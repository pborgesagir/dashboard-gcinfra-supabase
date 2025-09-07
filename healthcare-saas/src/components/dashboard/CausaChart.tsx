'use client'

import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useState } from 'react'

interface CausaData {
  causa: string
  count: number
  percentage: number
}

interface CausaChartProps {
  data: CausaData[]
  loading: boolean
  chartType?: 'bar' | 'pie'
}

const COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
  '#00bcd4', '#8bc34a', '#ffc107', '#e91e63', '#607d8b',
  '#795548', '#009688', '#3f51b5', '#ff5722', '#cddc39'
]

export default function CausaChart({ data, loading, chartType = 'bar' }: CausaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ordens de Serviço por Causa
          </Typography>
          <Skeleton variant="rectangular" width="100%" height={400} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ordens de Serviço por Causa
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="text.secondary">
              Nenhum dado de causa disponível para exibir o gráfico
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Sort data by count for better visualization
  const sortedData = [...data].sort((a, b) => b.count - a.count)
  
  // For bar chart, show only top 10
  const top10Data = sortedData.slice(0, 10)

  const formatTooltip = (value: number, name: string) => {
    if (name === 'count') {
      return [`${value.toLocaleString('pt-BR')} ordens`, 'Quantidade']
    }
    return [value, name]
  }

  const formatPieTooltip = (value: number, name: string) => {
    const item = sortedData.find(d => d.causa === name)
    return [
      `${value.toLocaleString('pt-BR')} ordens (${item?.percentage.toFixed(1)}%)`,
      name || 'Sem causa'
    ]
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={top10Data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 80
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="causa"
          angle={-45}
          textAnchor="end"
          height={100}
          fontSize={12}
          interval={0}
          tick={{ fontSize: 10 }}
        />
        <YAxis 
          tickFormatter={(value) => value.toLocaleString('pt-BR')}
          fontSize={12}
          label={{ value: 'Quantidade de OS', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={formatTooltip}
          labelFormatter={(label) => `Causa: ${label || 'Não informado'}`}
          contentStyle={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
        />
        
        <Bar
          dataKey="count"
          fill="#2196f3"
          name="count"
          radius={[4, 4, 0, 0]}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          {top10Data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === activeIndex ? '#1976d2' : '#2196f3'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={sortedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ causa, percentage }) => `${causa || 'N/A'} (${percentage.toFixed(1)}%)`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="count"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          {sortedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke={index === activeIndex ? '#333' : 'none'}
              strokeWidth={index === activeIndex ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip formatter={formatPieTooltip} />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => value || 'Não informado'}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  const totalOrders = sortedData.reduce((sum, item) => sum + item.count, 0)
  const topCausa = sortedData[0]
  const causasWithData = sortedData.filter(item => item.causa && item.causa.trim() !== '')

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {chartType === 'bar' ? 'Top 10 Ordens de Serviço por Causa' : 'Ordens de Serviço por Causa'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {chartType === 'bar' ? 'As 10 principais causas mais frequentes' : 'Distribuição das OS por causa identificada'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Total: {totalOrders.toLocaleString('pt-BR')} OS
            </Typography>
          </Box>
        </Box>
        
        {chartType === 'bar' ? renderBarChart() : renderPieChart()}

        {/* Summary statistics */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Principal Causa
            </Typography>
            <Typography variant="h6" color="#2196f3">
              {topCausa?.causa || 'Não informado'} ({topCausa?.count.toLocaleString('pt-BR')} OS)
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Causas Identificadas
            </Typography>
            <Typography variant="h6" color="#4caf50">
              {causasWithData.length} de {sortedData.length}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Taxa de Identificação
            </Typography>
            <Typography variant="h6" color="#ff9800">
              {totalOrders > 0 
                ? `${((causasWithData.reduce((sum, item) => sum + item.count, 0) / totalOrders) * 100).toFixed(1)}%`
                : '0%'
              }
            </Typography>
          </Box>
        </Box>

        {/* Top 5 causes */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Top 5 Causas Mais Frequentes:
          </Typography>
          <Box>
            {sortedData.slice(0, 5).map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  {index + 1}. {item.causa || 'Não informado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.count.toLocaleString('pt-BR')} OS ({item.percentage.toFixed(1)}%)
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}