'use client'
/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useState } from 'react'
import { Grid, Card, CardContent, Typography, Box, Skeleton, Chip, IconButton, Badge, Tooltip } from '@mui/material'
import { 
  Build, 
  Assignment, 
  CheckCircle, 
  AttachMoney,
  Timeline,
  Error,
  AssignmentTurnedIn,
  Speed,
  Warning as WarningIcon
} from '@mui/icons-material'
import EquipamentosIndisponiveisModal from './EquipamentosIndisponiveisModal'

interface EquipamentoIndisponivel {
  id: number
  equipamento: string | null
  tag: string | null
  setor: string | null
  data_chamado: string | null
  responsavel: string | null
  causa: string | null
  prioridade: string | null
  os: string | null
  empresa: string | null
}

interface KpiMetricsProps {
  data: {
    totalOrders: number
    openOrders: number
    avgFirstResponseHours: number
    totalCost: number
    mttr?: number
    mtbf?: number
    taxaCumprimentoPlanejadas?: number
    taxaDisponibilidade?: number
  } | null
  loading: boolean
  equipamentosIndisponiveis?: EquipamentoIndisponivel[]
}

export default function KpiMetrics({ data, loading, equipamentosIndisponiveis = [] }: KpiMetricsProps) {
  const [modalOpen, setModalOpen] = useState(false)
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
      title: 'Tempo Médio de 1º Atendimento',
      value: data?.avgFirstResponseHours || 0,
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
      format: (val: number) => `${val.toFixed(1)}h`,
      suffix: 'horas'
    },
    {
      title: 'Taxa de Cumprimento de OS Planejadas',
      value: data?.taxaCumprimentoPlanejadas || 0,
      icon: AssignmentTurnedIn,
      color: '#2e7d32',
      format: (val: number) => `${val.toFixed(1)}%`,
      suffix: 'percentual'
    },
    {
      title: 'Taxa de Disponibilidade',
      value: data?.taxaDisponibilidade || 0,
      icon: Speed,
      color: '#1565c0',
      format: (val: number) => `${val.toFixed(1)}%`,
      suffix: 'percentual',
      isInteractive: true,
      equipamentosParados: equipamentosIndisponiveis.length
    }
  ]

  return (
    <>
      {/* @ts-ignore */}
      <Grid container spacing={3} id="kpi-metrics">
        {kpis.map((kpi) => (
          /* @ts-ignore */
          <Grid item xs={12} sm={6} md={4} lg={true} key={kpi.title}>
            <Card 
              sx={{ 
                height: '100%',
                borderLeft: `4px solid ${kpi.color}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.2s ease-in-out'
                },
                cursor: kpi.isInteractive ? 'pointer' : 'default',
                position: 'relative'
              }}
              onClick={kpi.isInteractive ? () => setModalOpen(true) : undefined}
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
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography 
                          variant="h5" 
                          component="div"
                          fontWeight="bold"
                          color={kpi.color}
                        >
                          {kpi.format(kpi.value)}
                        </Typography>
                        {kpi.isInteractive && kpi.equipamentosParados > 0 && (
                          <Tooltip title={`${kpi.equipamentosParados} equipamentos parados - Clique para ver detalhes`}>
                            <Chip
                              size="small"
                              label={kpi.equipamentosParados}
                              icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                              sx={{
                                bgcolor: '#f44336',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                                '&:hover': {
                                  bgcolor: '#d32f2f'
                                },
                                animation: 'pulse 2s infinite'
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                    {kpi.isInteractive && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          mt: 0.5,
                          fontSize: '0.65rem'
                        }}
                      >
                        {kpi.equipamentosParados === 0 
                          ? 'Todos operacionais - Clique para detalhes'
                          : `${kpi.equipamentosParados} parados - Clique para detalhes`
                        }
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    {kpi.isInteractive ? (
                      <Badge 
                        badgeContent={kpi.equipamentosParados > 0 ? kpi.equipamentosParados : 0} 
                        color="error"
                        anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            minWidth: '18px',
                            height: '18px',
                            fontWeight: 'bold'
                          }
                        }}
                      >
                        <IconButton
                          sx={{ 
                            color: kpi.color, 
                            opacity: 0.8,
                            '&:hover': {
                              bgcolor: `${kpi.color}15`,
                              opacity: 1
                            }
                          }}
                          size="large"
                        >
                          <Speed sx={{ fontSize: 32 }} />
                        </IconButton>
                      </Badge>
                    ) : (
                      <kpi.icon 
                        sx={{ 
                          fontSize: 40, 
                          color: kpi.color, 
                          opacity: 0.7 
                        }} 
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal de Equipamentos Indisponíveis */}
      <EquipamentosIndisponiveisModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        equipamentos={equipamentosIndisponiveis}
      />
      
      {/* CSS para animação de pulse */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
          }
          70% {
            box-shadow: 0 0 0 5px rgba(244, 67, 54, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          }
        }
      `}</style>
    </>
  )
}