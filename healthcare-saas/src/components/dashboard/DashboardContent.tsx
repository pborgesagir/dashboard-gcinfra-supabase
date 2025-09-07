'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Alert,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import { 
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import KpiMetrics from './KpiMetrics'
import MaintenanceChart from './MaintenanceChart'
import HeatmapChart from './HeatmapChart'
import WorkOrderTrendChart from './WorkOrderTrendChart'
import ResponseTimeTrendChart from './ResponseTimeTrendChart'

interface MaintenanceOrder {
  id: number
  empresa: string | null
  os: string | null
  equipamento: string | null
  situacao: string | null
  abertura: string | null
  fechamento: string | null
  prioridade: string | null
  setor: string | null
  tipomanutencao: string | null
  data_chamado: string | null
  custo_os: number | null
  custo_mo: number | null
  custo_peca: number | null
  custo_servicoexterno: number | null
  company_id: string | null
}

interface FilterState {
  startDate: Date | null
  endDate: Date | null
  empresa: string
  equipamento: string
  prioridade: string[]
  setor: string[]
  tipomanutencao: string[]
  situacao: string[]
  possuiChamado: string
}

export default function DashboardContent() {
  const { userProfile, isAdmin } = useAuth()
  const [data, setData] = useState<MaintenanceOrder[]>([])
  const [filteredData, setFilteredData] = useState<MaintenanceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [dataType, setDataType] = useState<'clinical' | 'building'>('clinical')
  const [filters, setFilters] = useState<FilterState>({
    startDate: null,
    endDate: null,
    empresa: 'Todos',
    equipamento: 'Todos',
    prioridade: [],
    setor: [],
    tipomanutencao: [],
    situacao: [],
    possuiChamado: 'Todos'
  })

  // Table state management
  const [tablePage, setTablePage] = useState(0)
  const [tableRowsPerPage, setTableRowsPerPage] = useState(25)
  const [tableOrderBy, setTableOrderBy] = useState<keyof MaintenanceOrder>('abertura')
  const [tableOrder, setTableOrder] = useState<'asc' | 'desc'>('desc')
  const [showDataTable, setShowDataTable] = useState(false)

  // Get unique values for filter options
  const filterOptions = {
    empresas: ['Todos', ...new Set(data.map(item => item.empresa).filter(Boolean))],
    equipamentos: ['Todos', ...new Set(data.map(item => item.equipamento).filter(Boolean))],
    prioridades: [...new Set(data.map(item => item.prioridade).filter(Boolean))],
    setores: [...new Set(data.map(item => item.setor).filter(Boolean))],
    tiposManutencao: [...new Set(data.map(item => item.tipomanutencao).filter(Boolean))],
    situacoes: [...new Set(data.map(item => item.situacao).filter(Boolean))]
  }

  const fetchData = useCallback(async () => {
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

      // Fetch all data by implementing pagination
      let allOrders: MaintenanceOrder[] = []
      let from = 0
      const batchSize = 1000
      let hasMore = true

      setLoadingProgress('Carregando dados...')

      while (hasMore) {
        setLoadingProgress(`Carregando ${allOrders.length.toLocaleString()} registros...`)
        
        const { data: batch, error } = await query
          .range(from, from + batchSize - 1)
          
        if (error) throw error
        
        if (batch && batch.length > 0) {
          // Use concat for better performance with large arrays
          allOrders = allOrders.concat(batch)
          from += batchSize
          hasMore = batch.length === batchSize
          
          // Add small delay to prevent overwhelming the browser
          if (allOrders.length > 10000) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        } else {
          hasMore = false
        }
      }

      setLoadingProgress(`Carregados ${allOrders.length.toLocaleString()} registros!`)

      const orders = allOrders

      setData(orders || [])
      setFilteredData(orders || [])
    } catch (error: unknown) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
      setLoadingProgress('')
    }
  }, [dataType, userProfile, isAdmin])

  // Apply all filters to the data
  const applyFilters = useCallback(() => {
    let filtered = [...data]

    // Date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(item => {
        if (!item.abertura) return false
        const itemDate = new Date(item.abertura)
        
        if (filters.startDate && itemDate < filters.startDate) return false
        if (filters.endDate && itemDate > filters.endDate) return false
        
        return true
      })
    }

    // Single-choice filters
    if (filters.empresa !== 'Todos') {
      filtered = filtered.filter(item => item.empresa === filters.empresa)
    }

    if (filters.equipamento !== 'Todos') {
      filtered = filtered.filter(item => item.equipamento === filters.equipamento)
    }

    // Multiple-choice filters
    if (filters.prioridade.length > 0) {
      filtered = filtered.filter(item => 
        item.prioridade && filters.prioridade.includes(item.prioridade)
      )
    }

    if (filters.setor.length > 0) {
      filtered = filtered.filter(item => 
        item.setor && filters.setor.includes(item.setor)
      )
    }

    if (filters.tipomanutencao.length > 0) {
      filtered = filtered.filter(item => 
        item.tipomanutencao && filters.tipomanutencao.includes(item.tipomanutencao)
      )
    }

    if (filters.situacao.length > 0) {
      filtered = filtered.filter(item => 
        item.situacao && filters.situacao.includes(item.situacao)
      )
    }

    // Possui Chamado filter
    if (filters.possuiChamado !== 'Todos') {
      const hasTicket = filters.possuiChamado === 'Sim'
      filtered = filtered.filter(item => {
        const itemHasTicket = item.data_chamado && item.data_chamado.trim() !== ''
        return hasTicket ? itemHasTicket : !itemHasTicket
      })
    }

    setFilteredData(filtered)
  }, [data, filters])

  // Filter change handlers
  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    setFilters(prev => ({ ...prev, [field]: date }))
  }

  const handleSingleSelectChange = (field: 'empresa' | 'equipamento' | 'possuiChamado') => (
    event: SelectChangeEvent<string>
  ) => {
    setFilters(prev => ({ ...prev, [field]: event.target.value }))
  }

  const handleMultiSelectChange = (field: 'prioridade' | 'setor' | 'tipomanutencao' | 'situacao') => (
    event: SelectChangeEvent<string[]>
  ) => {
    const value = event.target.value
    setFilters(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value
    }))
  }

  // Table handlers
  const handleTableSort = (property: keyof MaintenanceOrder) => {
    const isAsc = tableOrderBy === property && tableOrder === 'asc'
    setTableOrder(isAsc ? 'desc' : 'asc')
    setTableOrderBy(property)
  }

  const handleTablePageChange = (event: unknown, newPage: number) => {
    setTablePage(newPage)
  }

  const handleTableRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTableRowsPerPage(parseInt(event.target.value, 10))
    setTablePage(0)
  }

  const formatCellValue = (value: unknown, column: string): string => {
    if (value === null || value === undefined || value === '') return '-'
    
    if (['abertura', 'fechamento', 'data_atendimento', 'data_chamado', 'data_solucao'].includes(column)) {
      return new Date(value).toLocaleString('pt-BR')
    }
    
    if (['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno'].includes(column)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value) || 0)
    }
    
    return String(value)
  }

  const exportToCSV = () => {
    const headers = [
      'OS', 'Empresa', 'Equipamento', 'Situação', 'Prioridade', 'Setor',
      'Abertura', 'Fechamento', 'Data Chamado', 'Data Atendimento',
      'Custo OS', 'Custo MO', 'Custo Peça', 'Custo Serviço Externo',
      'Responsável', 'Solicitante', 'Tipo Manutenção'
    ]
    
    const csvData = filteredData.map(row => [
      row.os || '',
      row.empresa || '',
      row.equipamento || '',
      row.situacao || '',
      row.prioridade || '',
      row.setor || '',
      row.abertura ? new Date(row.abertura).toLocaleString('pt-BR') : '',
      row.fechamento ? new Date(row.fechamento).toLocaleString('pt-BR') : '',
      row.data_chamado ? new Date(row.data_chamado).toLocaleString('pt-BR') : '',
      row.data_atendimento ? new Date(row.data_atendimento).toLocaleString('pt-BR') : '',
      row.custo_os || 0,
      row.custo_mo || 0,
      row.custo_peca || 0,
      row.custo_servicoexterno || 0,
      row.responsavel || '',
      row.solicitante || '',
      row.tipomanutencao || ''
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `dados_dashboard_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Process filtered data for KPIs
  const kpiData = {
    totalOrders: filteredData.length,
    openOrders: filteredData.filter(order => 
      ['Aberto', 'Em Andamento', 'Pendente'].includes(order.situacao || '')
    ).length,
    avgResolutionHours: (() => {
      const closedOrders = filteredData.filter(order => 
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
    totalCost: filteredData.reduce((sum, order) => {
      return sum + 
        (order.custo_os || 0) + 
        (order.custo_mo || 0) + 
        (order.custo_peca || 0) + 
        (order.custo_servicoexterno || 0)
    }, 0)
  }

  // Process filtered data for time series chart
  const timeSeriesData = (() => {
    const monthlyData = filteredData.reduce((acc, order) => {
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

  // Process filtered data for status chart
  const statusData = (() => {
    const statusCounts = filteredData.reduce((acc, order) => {
      const status = order.situacao || 'Sem Status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))
  })()

  // Process filtered data for heatmap
  const heatmapData = (() => {
    const hourDayData = filteredData.reduce((acc, order) => {
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

  // Process filtered data for work order trend (opened vs closed)
  const workOrderTrendData = (() => {
    const monthlyData: Record<string, { abertas: number; fechadas: number }> = {}
    
    // Process opened orders (abertura)
    filteredData.forEach(order => {
      if (order.abertura) {
        const date = new Date(order.abertura)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { abertas: 0, fechadas: 0 }
        }
        monthlyData[monthKey].abertas++
      }
    })
    
    // Process closed orders (fechamento)
    filteredData.forEach(order => {
      if (order.fechamento) {
        const date = new Date(order.fechamento)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { abertas: 0, fechadas: 0 }
        }
        monthlyData[monthKey].fechadas++
      }
    })

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24) // Last 24 months for better trend visibility
      .map(([month, counts]) => {
        const [year, monthNum] = month.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`
        const diferenca = counts.abertas - counts.fechadas
        
        return {
          month,
          monthDisplay,
          abertas: counts.abertas,
          fechadas: counts.fechadas,
          diferenca
        }
      })
  })()

  // Process filtered data for response time trend
  const responseTimeData = (() => {
    const monthlyData: Record<string, { 
      totalResponseTime: number; 
      ordersWithResponse: number; 
      totalOrders: number 
    }> = {}
    
    filteredData.forEach(order => {
      // Only process orders that have both data_chamado and data_atendimento
      if (order.data_chamado && order.data_atendimento) {
        const chamadoDate = new Date(order.data_chamado)
        const atendimentoDate = new Date(order.data_atendimento)
        
        // Calculate response time in hours
        const responseTimeMs = atendimentoDate.getTime() - chamadoDate.getTime()
        const responseTimeHours = responseTimeMs / (1000 * 60 * 60)
        
        // Only include positive response times (atendimento after chamado)
        if (responseTimeHours > 0) {
          const monthKey = `${chamadoDate.getFullYear()}-${(chamadoDate.getMonth() + 1).toString().padStart(2, '0')}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { totalResponseTime: 0, ordersWithResponse: 0, totalOrders: 0 }
          }
          
          monthlyData[monthKey].totalResponseTime += responseTimeHours
          monthlyData[monthKey].ordersWithResponse++
        }
      }
      
      // Count total orders by month (based on abertura date)
      if (order.abertura) {
        const aberturaDate = new Date(order.abertura)
        const monthKey = `${aberturaDate.getFullYear()}-${(aberturaDate.getMonth() + 1).toString().padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { totalResponseTime: 0, ordersWithResponse: 0, totalOrders: 0 }
        }
        monthlyData[monthKey].totalOrders++
      }
    })

    // Convert to array and calculate averages
    return Object.entries(monthlyData)
      .filter(([, data]) => data.ordersWithResponse > 0) // Only include months with response data
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24) // Last 24 months
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`
        const averageResponseHours = data.totalResponseTime / data.ordersWithResponse
        const averageResponseDays = averageResponseHours / 24
        
        return {
          month,
          monthDisplay,
          averageResponseHours,
          averageResponseDays,
          totalOrders: data.totalOrders,
          ordersWithResponse: data.ordersWithResponse
        }
      })
  })()

  // Sort filtered data for table display
  const sortedData = React.useMemo(() => {
    const comparator = (a: MaintenanceOrder, b: MaintenanceOrder): number => {
      const aValue = a[tableOrderBy]
      const bValue = b[tableOrderBy]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return tableOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (aValue < bValue) return tableOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return tableOrder === 'asc' ? 1 : -1
      return 0
    }
    
    return [...filteredData].sort(comparator)
  }, [filteredData, tableOrderBy, tableOrder])

  const paginatedData = React.useMemo(() => {
    const start = tablePage * tableRowsPerPage
    return sortedData.slice(start, start + tableRowsPerPage)
  }, [sortedData, tablePage, tableRowsPerPage])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
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

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          
          <Grid container spacing={3}>
            {/* Filtros de Data */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Inicial"
                value={filters.startDate}
                onChange={handleDateChange('startDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Data Final"
                value={filters.endDate}
                onChange={handleDateChange('endDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            {/* Filtros de Seleção Única */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={filters.empresa}
                  label="Empresa"
                  onChange={handleSingleSelectChange('empresa')}
                >
                  {filterOptions.empresas.map((empresa) => (
                    <MenuItem key={empresa} value={empresa}>
                      {empresa}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Equipamento</InputLabel>
                <Select
                  value={filters.equipamento}
                  label="Equipamento"
                  onChange={handleSingleSelectChange('equipamento')}
                >
                  {filterOptions.equipamentos.map((equipamento) => (
                    <MenuItem key={equipamento} value={equipamento}>
                      {equipamento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtros de Múltipla Escolha */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  multiple
                  value={filters.prioridade}
                  onChange={handleMultiSelectChange('prioridade')}
                  input={<OutlinedInput label="Prioridade" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {filterOptions.prioridades.map((prioridade) => (
                    <MenuItem key={prioridade} value={prioridade}>
                      <Checkbox checked={filters.prioridade.indexOf(prioridade) > -1} />
                      <ListItemText primary={prioridade} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Setor</InputLabel>
                <Select
                  multiple
                  value={filters.setor}
                  onChange={handleMultiSelectChange('setor')}
                  input={<OutlinedInput label="Setor" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {filterOptions.setores.map((setor) => (
                    <MenuItem key={setor} value={setor}>
                      <Checkbox checked={filters.setor.indexOf(setor) > -1} />
                      <ListItemText primary={setor} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Manutenção</InputLabel>
                <Select
                  multiple
                  value={filters.tipomanutencao}
                  onChange={handleMultiSelectChange('tipomanutencao')}
                  input={<OutlinedInput label="Tipo de Manutenção" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {filterOptions.tiposManutencao.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      <Checkbox checked={filters.tipomanutencao.indexOf(tipo) > -1} />
                      <ListItemText primary={tipo} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Situação</InputLabel>
                <Select
                  multiple
                  value={filters.situacao}
                  onChange={handleMultiSelectChange('situacao')}
                  input={<OutlinedInput label="Situação" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {filterOptions.situacoes.map((situacao) => (
                    <MenuItem key={situacao} value={situacao}>
                      <Checkbox checked={filters.situacao.indexOf(situacao) > -1} />
                      <ListItemText primary={situacao} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Possui Chamado</InputLabel>
                <Select
                  value={filters.possuiChamado}
                  label="Possui Chamado"
                  onChange={handleSingleSelectChange('possuiChamado')}
                >
                  <MenuItem value="Todos">Todos</MenuItem>
                  <MenuItem value="Sim">Sim</MenuItem>
                  <MenuItem value="Não">Não</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && loadingProgress && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {loadingProgress}
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

      {/* Work Order Trend Chart */}
      <Box mb={4}>
        <WorkOrderTrendChart data={workOrderTrendData} loading={loading} />
      </Box>

      {/* Response Time Trend Chart */}
      <Box mb={4}>
        <ResponseTimeTrendChart data={responseTimeData} loading={loading} />
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
                    filteredData.reduce((acc, order) => {
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
                    filteredData.reduce((acc, order) => {
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

      {/* Data Table Section */}
      <Box mt={4}>
        <Accordion expanded={showDataTable} onChange={() => setShowDataTable(!showDataTable)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="data-table-content"
            id="data-table-header"
            sx={{
              bgcolor: '#f5f5f5',
              '&:hover': { bgcolor: '#eeeeee' }
            }}
          >
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <TableChartIcon color="primary" />
              <Box flexGrow={1}>
                <Typography variant="h6">
                  Dados Filtrados ({filteredData.length.toLocaleString('pt-BR')} registros)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualize e exporte os dados por trás dos gráficos
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={(e) => {
                    e.stopPropagation()
                    exportToCSV()
                  }}
                  disabled={filteredData.length === 0}
                >
                  Exportar CSV
                </Button>
                <Chip 
                  label={filteredData.length.toLocaleString('pt-BR')}
                  size="small"
                  color="primary"
                />
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails sx={{ p: 0 }}>
            {filteredData.length > 0 ? (
              <>
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'os'}
                            direction={tableOrderBy === 'os' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('os')}
                          >
                            OS
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'empresa'}
                            direction={tableOrderBy === 'empresa' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('empresa')}
                          >
                            Empresa
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'equipamento'}
                            direction={tableOrderBy === 'equipamento' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('equipamento')}
                          >
                            Equipamento
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'situacao'}
                            direction={tableOrderBy === 'situacao' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('situacao')}
                          >
                            Situação
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'prioridade'}
                            direction={tableOrderBy === 'prioridade' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('prioridade')}
                          >
                            Prioridade
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'setor'}
                            direction={tableOrderBy === 'setor' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('setor')}
                          >
                            Setor
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'abertura'}
                            direction={tableOrderBy === 'abertura' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('abertura')}
                          >
                            Abertura
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'fechamento'}
                            direction={tableOrderBy === 'fechamento' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('fechamento')}
                          >
                            Fechamento
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'data_chamado'}
                            direction={tableOrderBy === 'data_chamado' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('data_chamado')}
                          >
                            Data Chamado
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={tableOrderBy === 'data_atendimento'}
                            direction={tableOrderBy === 'data_atendimento' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('data_atendimento')}
                          >
                            Data Atendimento
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={tableOrderBy === 'custo_os'}
                            direction={tableOrderBy === 'custo_os' ? tableOrder : 'asc'}
                            onClick={() => handleTableSort('custo_os')}
                          >
                            Custo Total
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Responsável</TableCell>
                        <TableCell>Solicitante</TableCell>
                        <TableCell>Tipo Manutenção</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {row.os || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {row.empresa || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {row.equipamento || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.situacao || 'Sem Status'}
                              size="small"
                              color={
                                ['Fechado', 'Concluído', 'Finalizado'].includes(row.situacao || '') ? 'success' :
                                ['Em Andamento', 'Em Execução'].includes(row.situacao || '') ? 'warning' :
                                ['Aberto', 'Pendente'].includes(row.situacao || '') ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.prioridade || 'Normal'}
                              size="small"
                              color={
                                ['Alta', 'Urgente', 'Crítica'].includes(row.prioridade || '') ? 'error' :
                                ['Média'].includes(row.prioridade || '') ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{row.setor || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCellValue(row.abertura, 'abertura')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCellValue(row.fechamento, 'fechamento')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCellValue(row.data_chamado, 'data_chamado')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCellValue(row.data_atendimento, 'data_atendimento')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCellValue(
                                (row.custo_os || 0) + (row.custo_mo || 0) + 
                                (row.custo_peca || 0) + (row.custo_servicoexterno || 0),
                                'custo_os'
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.responsavel || '-'}</TableCell>
                          <TableCell>{row.solicitante || '-'}</TableCell>
                          <TableCell>{row.tipomanutencao || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={filteredData.length}
                  page={tablePage}
                  onPageChange={handleTablePageChange}
                  rowsPerPage={tableRowsPerPage}
                  onRowsPerPageChange={handleTableRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelDisplayedRows={({ from, to, count }) => 
                    `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                  }
                  labelRowsPerPage="Linhas por página:"
                />
              </>
            ) : (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary">
                  Nenhum dado disponível com os filtros aplicados
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      </Box>
    </LocalizationProvider>
  )
}