'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import KpiMetrics from './KpiMetrics'
import MaintenanceChart from './MaintenanceChart'
import HeatmapChart from './HeatmapChart'

interface MaintenanceOrder {
  id: number
  empresa: string | null
  os: string | null
  equipamento: string | null
  situacao: string | null
  abertura: string | null
  fechamento: string | null
  prioridade: string | null
  custo_os: number | null
  custo_mo: number | null
  custo_peca: number | null
  custo_servicoexterno: number | null
  company_id: string | null
}

export default function DashboardContent() {
  const { userProfile, isAdmin } = useAuth()
  const [data, setData] = useState<MaintenanceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataType, setDataType] = useState<'clinical' | 'building'>('clinical')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const tableName = dataType === 'clinical' ? 'maintenance_orders' : 'building_orders'
      
      let query = supabase
        .from(tableName)
        .select('*')
        .order('abertura', { ascending: false })

      // Apply company filter for managers
      if (!isAdmin && userProfile?.company_id) {
        query = query.eq('company_id', userProfile.company_id)
      }

      const { data: orders, error } = await query.limit(1000)

      if (error) throw error

      setData(orders || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dataType, userProfile, isAdmin])

  // Process data for KPIs
  const kpiData = {
    totalOrders: data.length,
    openOrders: data.filter(order => 
      ['Aberto', 'Em Andamento', 'Pendente'].includes(order.situacao || '')
    ).length,
    avgResolutionHours: (() => {
      const closedOrders = data.filter(order => 
        order.abertura && order.fechamento
      )
      if (closedOrders.length === 0) return 0
      
      const totalHours = closedOrders.reduce((sum, order) => {
        const start = new Date(order.abertura!)
        const end = new Date(order.fechamento!)
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }, 0)
      
      return totalHours / closedOrders.length
    })(),
    totalCost: data.reduce((sum, order) => {
      return sum + 
        (order.custo_os || 0) + 
        (order.custo_mo || 0) + 
        (order.custo_peca || 0) + 
        (order.custo_servicoexterno || 0)
    }, 0)
  }

  // Process data for time series chart
  const timeSeriesData = (() => {
    const monthlyData = data.reduce((acc, order) => {
      if (!order.abertura) return acc
      
      const date = new Date(order.abertura)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
      .slice(-12) // Last 12 months
  })()

  // Process data for status chart
  const statusData = (() => {
    const statusCounts = data.reduce((acc, order) => {
      const status = order.situacao || 'Sem Status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))
  })()

  // Process data for heatmap
  const heatmapData = (() => {
    const hourDayData = data.reduce((acc, order) => {
      if (!order.abertura) return acc
      
      const date = new Date(order.abertura)
      const hour = date.getHours()
      const day = date.getDay()
      const key = `${day}-${hour}`
      
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(hourDayData).map(([key, value]) => {
      const [day, hour] = key.split('-').map(Number)
      return { hour, day, value }
    })
  })()

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard - {dataType === 'clinical' ? 'Engenharia Clínica' : 'Engenharia Predial'}
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Tipo de Dados</InputLabel>
          <Select
            value={dataType}
            label="Tipo de Dados"
            onChange={(e) => setDataType(e.target.value as 'clinical' | 'building')}
          >
            <MenuItem value="clinical">Engenharia Clínica</MenuItem>
            <MenuItem value="building">Engenharia Predial</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isAdmin && userProfile?.company && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Visualizando dados da empresa: {userProfile.company.name}
        </Alert>
      )}

      {/* KPI Metrics */}
      <Box mb={4}>
        <KpiMetrics data={kpiData} loading={loading} />
      </Box>

      {/* Charts */}
      <Box mb={4}>
        <MaintenanceChart 
          timeSeriesData={timeSeriesData}
          statusData={statusData}
          loading={loading}
        />
      </Box>

      {/* Heatmap */}
      <Box mb={4}>
        <HeatmapChart data={heatmapData} loading={loading} />
      </Box>

      {/* Data Summary */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 10 Equipamentos por Quantidade de OS
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Carregando...</Typography>
              ) : (
                <Box>
                  {Object.entries(
                    data.reduce((acc, order) => {
                      const equipment = order.equipamento || 'Sem Equipamento'
                      acc[equipment] = (acc[equipment] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([equipment, count], index) => (
                      <Box key={equipment} display="flex" justifyContent="space-between" py={1}>
                        <Typography variant="body2">
                          {index + 1}. {equipment}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {count}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribuição por Prioridade
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Carregando...</Typography>
              ) : (
                <Box>
                  {Object.entries(
                    data.reduce((acc, order) => {
                      const priority = order.prioridade || 'Sem Prioridade'
                      acc[priority] = (acc[priority] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([priority, count]) => (
                      <Box key={priority} display="flex" justifyContent="space-between" py={1}>
                        <Typography variant="body2">
                          {priority}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {count}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}