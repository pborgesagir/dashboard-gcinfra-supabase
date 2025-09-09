'use client'

import { Card, CardContent, Typography, Box, Skeleton, Chip } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ResponseTimeData {
  month: string
  monthDisplay: string
  averageResponseHours: number
  averageResponseDays: number
  totalOrders: number
  ordersWithResponse: number
}

interface ResponseTimeTrendChartProps {
  data: ResponseTimeData[]
  loading: boolean
}

export default function ResponseTimeTrendChart({ data, loading }: ResponseTimeTrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tendência do Tempo Médio de Primeira Resposta
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
            Tendência do Tempo Médio de Primeira Resposta
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="text.secondary">
              Nenhum dado de tempo de resposta disponível para exibir o gráfico
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Calculate overall statistics
  const overallStats = data.reduce((acc, month) => {
    acc.totalOrders += month.totalOrders
    acc.ordersWithResponse += month.ordersWithResponse
    acc.totalResponseTime += month.averageResponseHours * month.ordersWithResponse
    return acc
  }, { totalOrders: 0, ordersWithResponse: 0, totalResponseTime: 0 })

  const overallAverageHours = overallStats.ordersWithResponse > 0 
    ? overallStats.totalResponseTime / overallStats.ordersWithResponse 
    : 0

  const responseRate = overallStats.totalOrders > 0 
    ? (overallStats.ordersWithResponse / overallStats.totalOrders) * 100 
    : 0

  const formatTooltip = (value: number, name: string) => {
    if (name === 'averageResponseHours') {
      const hours = Math.floor(value)
      const minutes = Math.round((value - hours) * 60)
      return [`${hours}h ${minutes}min`, 'Tempo Médio de Resposta']
    }
    return [value, name]
  }

  const formatYAxisLabel = (value: number) => {
    if (value >= 24) {
      return `${Math.round(value / 24)}d`
    }
    return `${Math.round(value)}h`
  }

  // Calculate trend direction
  const firstValue = data[0]?.averageResponseHours || 0
  const lastValue = data[data.length - 1]?.averageResponseHours || 0
  const trend = lastValue - firstValue
  const trendPercentage = firstValue > 0 ? ((trend / firstValue) * 100) : 0

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Tendência do Tempo Médio de Primeira Resposta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Baseado na diferença entre data_atendimento e data_chamado
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip 
              label={`Taxa de Resposta: ${responseRate.toFixed(1)}%`}
              size="small"
              color={responseRate >= 80 ? 'success' : responseRate >= 60 ? 'warning' : 'error'}
            />
            <Chip 
              label={trend >= 0 ? `+${trendPercentage.toFixed(1)}%` : `${trendPercentage.toFixed(1)}%`}
              size="small"
              color={trend <= 0 ? 'success' : 'error'}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
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
              label={{ value: 'Tempo de Resposta', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(label) => `Mês: ${label}`}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Average response time line */}
            <Line
              type="monotone"
              dataKey="averageResponseHours"
              stroke="#e91e63"
              strokeWidth={3}
              dot={{ fill: '#e91e63', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#e91e63', strokeWidth: 2 }}
              name="averageResponseHours"
            />
            
            {/* Reference line for overall average */}
            <ReferenceLine 
              y={overallAverageHours} 
              stroke="#9e9e9e" 
              strokeDasharray="5 5"
              label={{ value: "Média Geral", position: "top" }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary statistics */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tempo Médio Geral
            </Typography>
            <Typography variant="h6" color="#e91e63">
              {Math.floor(overallAverageHours)}h {Math.round((overallAverageHours % 1) * 60)}min
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Ordens com Resposta
            </Typography>
            <Typography variant="h6" color="#4caf50">
              {overallStats.ordersWithResponse.toLocaleString('pt-BR')} de {overallStats.totalOrders.toLocaleString('pt-BR')}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Melhor Mês
            </Typography>
            <Typography variant="h6" color="#2196f3">
              {(() => {
                const bestMonth = data.reduce((min, current) => 
                  current.averageResponseHours < min.averageResponseHours ? current : min
                )
                const hours = Math.floor(bestMonth.averageResponseHours)
                const minutes = Math.round((bestMonth.averageResponseHours % 1) * 60)
                return `${bestMonth.monthDisplay} (${hours}h ${minutes}min)`
              })()}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Pior Mês
            </Typography>
            <Typography variant="h6" color="#f44336">
              {(() => {
                const worstMonth = data.reduce((max, current) => 
                  current.averageResponseHours > max.averageResponseHours ? current : max
                )
                const hours = Math.floor(worstMonth.averageResponseHours)
                const minutes = Math.round((worstMonth.averageResponseHours % 1) * 60)
                return `${worstMonth.monthDisplay} (${hours}h ${minutes}min)`
              })()}
            </Typography>
          </Box>
        </Box>

        {/* Performance indicators */}
        <Box sx={{ mt: 3, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Indicadores de Performance:
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip 
              label={overallAverageHours <= 24 ? "Excelente (≤24h)" : overallAverageHours <= 48 ? "Bom (≤48h)" : "Precisa Melhorar (>48h)"}
              size="small"
              color={overallAverageHours <= 24 ? 'success' : overallAverageHours <= 48 ? 'warning' : 'error'}
            />
            <Chip 
              label={responseRate >= 90 ? "Taxa Alta (≥90%)" : responseRate >= 70 ? "Taxa Média (≥70%)" : "Taxa Baixa (<70%)"}
              size="small"
              color={responseRate >= 90 ? 'success' : responseRate >= 70 ? 'warning' : 'error'}
            />
            <Chip 
              label={trend <= 0 ? "Tendência Positiva" : "Tendência de Piora"}
              size="small"
              color={trend <= 0 ? 'success' : 'error'}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}