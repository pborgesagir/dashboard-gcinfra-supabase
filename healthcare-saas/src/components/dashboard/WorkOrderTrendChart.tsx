'use client'

import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface WorkOrderTrendData {
  month: string
  monthDisplay: string
  abertas: number
  fechadas: number
  diferenca: number
}

interface WorkOrderTrendChartProps {
  data: WorkOrderTrendData[]
  loading: boolean
}

export default function WorkOrderTrendChart({ data, loading }: WorkOrderTrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tendência de Ordens de Serviço - Abertas vs Fechadas
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
            Tendência de Ordens de Serviço - Abertas vs Fechadas
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="text.secondary">
              Nenhum dado disponível para exibir o gráfico
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      abertas: 'Ordens Abertas',
      fechadas: 'Ordens Fechadas',
      diferenca: 'Diferença (Abertas - Fechadas)'
    }
    return [`${value.toLocaleString('pt-BR')} ordens`, labels[name] || name]
  }

  const formatXAxisLabel = (tickItem: string) => {
    return tickItem
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Tendência de Ordens de Serviço - Abertas vs Fechadas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Comparação mensal entre ordens abertas e fechadas ao longo do tempo
        </Typography>
        
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
              tickFormatter={formatXAxisLabel}
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
              fontSize={12}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(label) => `Mês: ${label}`}
              contentStyle={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            
            {/* Opened orders line */}
            <Line
              type="monotone"
              dataKey="abertas"
              stroke="#2196f3"
              strokeWidth={3}
              dot={{ fill: '#2196f3', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#2196f3', strokeWidth: 2 }}
              name="abertas"
            />
            
            {/* Closed orders line */}
            <Line
              type="monotone"
              dataKey="fechadas"
              stroke="#4caf50"
              strokeWidth={3}
              dot={{ fill: '#4caf50', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#4caf50', strokeWidth: 2 }}
              name="fechadas"
            />
            
            {/* Difference line (optional - can be toggled) */}
            <Line
              type="monotone"
              dataKey="diferenca"
              stroke="#ff9800"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ff9800', strokeWidth: 2 }}
              name="diferenca"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total de Ordens Abertas
            </Typography>
            <Typography variant="h6" color="#2196f3">
              {data.reduce((sum, item) => sum + item.abertas, 0).toLocaleString('pt-BR')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total de Ordens Fechadas
            </Typography>
            <Typography variant="h6" color="#4caf50">
              {data.reduce((sum, item) => sum + item.fechadas, 0).toLocaleString('pt-BR')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Diferença Acumulada
            </Typography>
            <Typography 
              variant="h6" 
              color={data.reduce((sum, item) => sum + item.diferenca, 0) >= 0 ? '#ff9800' : '#f44336'}
            >
              {data.reduce((sum, item) => sum + item.diferenca, 0) > 0 ? '+' : ''}
              {data.reduce((sum, item) => sum + item.diferenca, 0).toLocaleString('pt-BR')}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}