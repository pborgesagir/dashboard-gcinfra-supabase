'use client'

import { Card, CardContent, Typography, Box, Skeleton, Chip } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface MonthlyData {
  month: string
  monthDisplay: string
  media: number
  [key: string]: string | number // Para os diferentes tipos de manutenção
}

interface TaxaCumprimentoPlanejadaChartProps {
  data: MonthlyData[]
  loading: boolean
  tiposManutencao: string[]
}


export default function TaxaCumprimentoPlanejadaChart({ 
  data, 
  loading, 
  tiposManutencao 
}: TaxaCumprimentoPlanejadaChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Taxa Mensal de Cumprimento de OS Planejadas
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
            Taxa Mensal de Cumprimento de OS Planejadas
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="text.secondary">
              Nenhum dado de OS planejadas disponível para exibir o gráfico
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const formatTooltip = (value: number) => {
    return [`${value.toFixed(1)}%`, 'Taxa de Cumprimento']
  }

  const formatYAxisLabel = (value: number) => {
    return `${Math.round(value)}%`
  }

  // Calculate overall statistics
  const overallStats = data.reduce((acc, month) => {
    acc.totalMonths++
    acc.totalMedia += month.media
    
    // Sum all maintenance types
    tiposManutencao.forEach(tipo => {
      const value = month[tipo] as number
      if (value > 0) {
        acc.totalByType[tipo] = (acc.totalByType[tipo] || 0) + value
        acc.countByType[tipo] = (acc.countByType[tipo] || 0) + 1
      }
    })
    
    return acc
  }, { 
    totalMonths: 0, 
    totalMedia: 0, 
    totalByType: {} as Record<string, number>,
    countByType: {} as Record<string, number>
  })

  const overallAverage = overallStats.totalMonths > 0 
    ? overallStats.totalMedia / overallStats.totalMonths 
    : 0

  // Calculate trend
  const firstValue = data[0]?.media || 0
  const lastValue = data[data.length - 1]?.media || 0
  const trend = lastValue - firstValue
  const trendPercentage = firstValue > 0 ? ((trend / firstValue) * 100) : 0

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Taxa Mensal de Cumprimento de OS Planejadas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              % de OS planejadas fechadas vs abertas (média mensal)
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip 
              label={trend >= 0 ? `+${trendPercentage.toFixed(1)}%` : `${trendPercentage.toFixed(1)}%`}
              size="small"
              color={trend >= 0 ? 'success' : 'error'}
            />
          </Box>
        </Box>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="monthDisplay"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatYAxisLabel}
              fontSize={12}
              label={{ value: 'Taxa de Cumprimento (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Average line only */}
            <Line
              type="monotone"
              dataKey="media"
              stroke="#2196f3"
              strokeWidth={3}
              dot={{ fill: '#2196f3', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#2196f3', strokeWidth: 2 }}
              name="media"
            />
            
            {/* Reference line for overall average */}
            <ReferenceLine 
              y={overallAverage} 
              stroke="#9e9e9e" 
              strokeDasharray="5 5"
              label={{ value: "Média Geral", position: "topLeft" }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary statistics */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Taxa Média Geral
            </Typography>
            <Typography variant="h6" color="#2196f3">
              {overallAverage.toFixed(1)}%
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Melhor Mês
            </Typography>
            <Typography variant="h6" color="#4caf50">
              {(() => {
                const bestMonth = data.reduce((max, current) => 
                  current.media > max.media ? current : max
                )
                return `${bestMonth.monthDisplay} (${bestMonth.media.toFixed(1)}%)`
              })()}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Pior Mês
            </Typography>
            <Typography variant="h6" color="#f44336">
              {(() => {
                const worstMonth = data.reduce((min, current) => 
                  current.media < min.media ? current : min
                )
                return `${worstMonth.monthDisplay} (${worstMonth.media.toFixed(1)}%)`
              })()}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Tendência
            </Typography>
            <Typography variant="h6" color={trend >= 0 ? '#4caf50' : '#f44336'}>
              {trend >= 0 ? 'Melhoria' : 'Piora'} ({Math.abs(trendPercentage).toFixed(1)}%)
            </Typography>
          </Box>
        </Box>

        {/* Performance indicators */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Indicadores de Performance:
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip 
              label={overallAverage >= 80 ? "Excelente (≥80%)" : overallAverage >= 60 ? "Bom (≥60%)" : overallAverage >= 40 ? "Regular (≥40%)" : "Precisa Melhorar (<40%)"}
              size="small"
              color={overallAverage >= 80 ? 'success' : overallAverage >= 60 ? 'info' : overallAverage >= 40 ? 'warning' : 'error'}
            />
            <Chip 
              label={trend >= 0 ? "Tendência Positiva" : "Tendência Negativa"}
              size="small"
              color={trend >= 0 ? 'success' : 'error'}
            />
            <Chip 
              label="Baseado em OS Planejadas"
              size="small"
              color="default"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}