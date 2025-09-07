'use client'

import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material'
import { 
  Build, 
  Assignment, 
  CheckCircle, 
  AttachMoney,
  Timeline,
  Error 
} from '@mui/icons-material'

interface KpiMetricsProps {
  data: {
    totalOrders: number
    openOrders: number
    avgResolutionHours: number
    totalCost: number
    mttr?: number
    mtbf?: number
  } | null
  loading: boolean
}

export default function KpiMetrics({ data, loading }: KpiMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const kpis = [
    {
      title: 'Total de Ordens',
      value: data?.totalOrders || 0,
      icon: Assignment,
      color: '#1976d2',
      format: formatNumber
    },
    {
      title: 'Ordens em Aberto',
      value: data?.openOrders || 0,
      icon: Error,
      color: '#f57c00',
      format: formatNumber
    },
    {
      title: 'Tempo Médio de Resolução',
      value: data?.avgResolutionHours || 0,
      icon: Timeline,
      color: '#388e3c',
      format: (val: number) => `${val.toFixed(1)}h`,
      suffix: 'horas'
    },
    {
      title: 'Custo Total',
      value: data?.totalCost || 0,
      icon: AttachMoney,
      color: '#7b1fa2',
      format: formatCurrency
    },
    {
      title: 'MTTR',
      value: data?.mttr || 0,
      icon: Build,
      color: '#d32f2f',
      format: (val: number) => `${val.toFixed(1)}h`,
      suffix: 'horas'
    },
    {
      title: 'MTBF',
      value: data?.mtbf || 0,
      icon: CheckCircle,
      color: '#1976d2',
      format: (val: number) => `${val.toFixed(0)}d`,
      suffix: 'dias'
    }
  ]

  return (
    <Grid container spacing={3}>
      {kpis.map((kpi) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={kpi.title}>
          <Card 
            sx={{ 
              height: '100%',
              borderLeft: `4px solid ${kpi.color}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.2s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {kpi.title}
                  </Typography>
                  {loading ? (
                    <Skeleton variant="text" width={80} height={32} />
                  ) : (
                    <Typography 
                      variant="h5" 
                      component="div"
                      fontWeight="bold"
                      color={kpi.color}
                    >
                      {kpi.format(kpi.value)}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <kpi.icon 
                    sx={{ 
                      fontSize: 40, 
                      color: kpi.color, 
                      opacity: 0.7 
                    }} 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}