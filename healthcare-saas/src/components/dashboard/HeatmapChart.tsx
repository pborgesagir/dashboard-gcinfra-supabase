'use client'

import { Card, CardContent, Typography, Box } from '@mui/material'
import { useMemo } from 'react'

interface HeatmapData {
  hour: number
  day: number
  value: number
}

interface HeatmapChartProps {
  data: HeatmapData[]
  loading: boolean
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function HeatmapChart({ data, loading }: HeatmapChartProps) {
  const heatmapMatrix = useMemo(() => {
    const matrix: number[][] = Array(7).fill(0).map(() => Array(24).fill(0))
    
    data.forEach(item => {
      if (item.day >= 0 && item.day < 7 && item.hour >= 0 && item.hour < 24) {
        matrix[item.day][item.hour] = item.value
      }
    })
    
    return matrix
  }, [data])

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value), 1)
  }, [data])

  const getColor = (value: number) => {
    const intensity = value / maxValue
    const blue = Math.floor(255 * (1 - intensity * 0.7))
    return `rgb(33, ${blue}, ${255 - Math.floor(intensity * 100)})`
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Heatmap de Abertura de OS
          </Typography>
          <Box height={300} display="flex" alignItems="center" justifyContent="center">
            <Typography color="text.secondary">Carregando...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Padrão de Abertura de Ordens de Serviço por Dia da Semana e Horário
        </Typography>
        
        <Box sx={{ overflowX: 'auto', p: 2 }}>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: 'auto repeat(24, 1fr)',
              gap: 1,
              minWidth: 800
            }}
          >
            {/* Header with hours */}
            <Box />
            {HOURS.map(hour => (
              <Box 
                key={hour}
                sx={{ 
                  textAlign: 'center', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  color: 'text.secondary'
                }}
              >
                {hour}h
              </Box>
            ))}
            
            {/* Heatmap cells */}
            {WEEKDAYS.map((day, dayIndex) => (
              <Box key={`row-${dayIndex}`} sx={{ display: 'contents' }}>
                <Box
                  key={`day-${dayIndex}`}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    color: 'text.secondary',
                    pr: 1
                  }}
                >
                  {day}
                </Box>
                {HOURS.map(hour => {
                  const value = heatmapMatrix[dayIndex][hour]
                  return (
                    <Box
                      key={`${dayIndex}-${hour}`}
                      sx={{
                        minHeight: 30,
                        backgroundColor: getColor(value),
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: value > maxValue * 0.5 ? 'white' : 'black',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          zIndex: 1
                        }
                      }}
                      title={`${day} ${hour}:00 - ${value} ordens`}
                    >
                      {value > 0 ? value : ''}
                    </Box>
                  )
                })}
              </Box>
            ))}
          </Box>
          
          <Box mt={2} display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Menor atividade
            </Typography>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: getColor(0),
                borderRadius: 1 
              }} 
            />
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: getColor(maxValue * 0.5),
                borderRadius: 1 
              }} 
            />
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: getColor(maxValue),
                borderRadius: 1 
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              Maior atividade
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}