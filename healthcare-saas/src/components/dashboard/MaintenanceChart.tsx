'use client'

import { Card, CardContent, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface MaintenanceChartProps {
  timeSeriesData: Array<{
    month: string
    count: number
  }>
  statusData: Array<{
    name: string
    value: number
  }>
  loading: boolean
}

const COLORS = ['#1976d2', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2', '#00796b']

export default function MaintenanceChart({ timeSeriesData, statusData, loading }: MaintenanceChartProps) {
  if (loading) {
    return (
      <Box display="flex" gap={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tendência de Ordens de Serviço
            </Typography>
            <Box height={300} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">Carregando...</Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribuição por Status
            </Typography>
            <Box height={300} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">Carregando...</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} id="maintenance-chart">
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tendência de Ordens de Serviço
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value, 'Ordens de Serviço']}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#1976d2" 
                strokeWidth={3}
                dot={{ fill: '#1976d2', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribuição por Status
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  )
}