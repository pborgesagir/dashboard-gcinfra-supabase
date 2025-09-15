'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Grid, 
  Card,
  CardContent,
  Alert,
  Chip,
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
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material'
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
import CausaChart from './CausaChart'
import FamiliaChart from './FamiliaChart'
import TipoManutencaoChart from './TipoManutencaoChart'
import SetorChart from './SetorChart'
import TaxaCumprimentoPlanejadaChart from './TaxaCumprimentoPlanejadaChart'
import FiltersSection from './FiltersSection'

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
  oficina: string | null
  tipomanutencao: string | null
  data_chamado: string | null
  data_atendimento: string | null
  responsavel: string | null
  solicitante: string | null
  causa: string | null
  familia: string | null
  tag: string | null
  custo_os: number | null
  custo_mo: number | null
  custo_peca: number | null
  custo_servicoexterno: number | null
  company_id: string | null
}

interface FilterState {
  aberturaStartDate: Date | null
  aberturaEndDate: Date | null
  fechamentoStartDate: Date | null
  fechamentoEndDate: Date | null
  empresa: string[]
  equipamento: string[]
  familia: string[]
  prioridade: string[]
  setor: string[]
  oficina: string[]
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
    aberturaStartDate: null,
    aberturaEndDate: null,
    fechamentoStartDate: null,
    fechamentoEndDate: null,
    empresa: [],
    equipamento: [],
    familia: [],
    prioridade: [],
    setor: [],
    oficina: [],
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
    empresas: [...new Set(data.map(item => item.empresa).filter(Boolean))] as string[],
    equipamentos: [...new Set(data.map(item => item.equipamento).filter(Boolean))] as string[],
    familias: [...new Set(data.map(item => item.familia).filter(Boolean))] as string[],
    prioridades: [...new Set(data.map(item => item.prioridade).filter(Boolean))] as string[],
    setores: [...new Set(data.map(item => item.setor).filter(Boolean))] as string[],
    oficinas: [...new Set(data.map(item => item.oficina).filter(Boolean))] as string[],
    tiposManutencao: [...new Set(data.map(item => item.tipomanutencao).filter(Boolean))] as string[],
    situacoes: [...new Set(data.map(item => item.situacao).filter(Boolean))] as string[]
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
    // Filter by abertura date range
    if (filters.aberturaStartDate || filters.aberturaEndDate) {
      filtered = filtered.filter(item => {
        if (!item.abertura) return false
        const itemDate = new Date(item.abertura)
        
        if (filters.aberturaStartDate && itemDate < filters.aberturaStartDate) return false
        if (filters.aberturaEndDate && itemDate > filters.aberturaEndDate) return false
        
        return true
      })
    }

    // Filter by fechamento date range
    if (filters.fechamentoStartDate || filters.fechamentoEndDate) {
      filtered = filtered.filter(item => {
        if (!item.fechamento) return false
        const itemDate = new Date(item.fechamento)
        
        if (filters.fechamentoStartDate && itemDate < filters.fechamentoStartDate) return false
        if (filters.fechamentoEndDate && itemDate > filters.fechamentoEndDate) return false
        
        return true
      })
    }

    // Multiple-choice filters
    if (filters.empresa.length > 0) {
      filtered = filtered.filter(item => 
        item.empresa && filters.empresa.includes(item.empresa)
      )
    }

    if (filters.equipamento.length > 0) {
      filtered = filtered.filter(item => 
        item.equipamento && filters.equipamento.includes(item.equipamento)
      )
    }

    if (filters.familia.length > 0) {
      filtered = filtered.filter(item => 
        item.familia && filters.familia.includes(item.familia)
      )
    }
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
  const handleDateChange = (field: 'aberturaStartDate' | 'aberturaEndDate' | 'fechamentoStartDate' | 'fechamentoEndDate') => (date: Date | null) => {
    setFilters(prev => ({ ...prev, [field]: date }))
  }

  const handleSingleSelectChange = (field: 'possuiChamado') => (
    event: SelectChangeEvent<string>
  ) => {
    setFilters(prev => ({ ...prev, [field]: event.target.value }))
  }

  const handleMultiSelectChange = (field: 'empresa' | 'equipamento' | 'familia' | 'prioridade' | 'setor' | 'oficina' | 'tipomanutencao' | 'situacao') => (
    event: SelectChangeEvent<string[]>
  ) => {
    const value = event.target.value
    setFilters(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value
    }))
  }

  const clearFilters = () => {
    setFilters({
      aberturaStartDate: null,
      aberturaEndDate: null,
      fechamentoStartDate: null,
      fechamentoEndDate: null,
      empresa: [],
      equipamento: [],
      familia: [],
      prioridade: [],
      setor: [],
      oficina: [],
      tipomanutencao: [],
      situacao: [],
      possuiChamado: 'Todos'
    })
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
      return new Date(value as string | number | Date).toLocaleString('pt-BR')
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

  // Calculate data range from all data (not filtered)
  const dataRange = React.useMemo(() => {
    const dates = data
      .map(order => order.abertura)
      .filter(date => date)
      .map(date => new Date(date!))
      .sort((a, b) => a.getTime() - b.getTime())
    
    if (dates.length >= 2) {
      return {
        start: dates[0],
        end: dates[dates.length - 1]
      }
    }
    return null
  }, [data])

  // Process filtered data for KPIs
  const kpiData = {
    totalOrders: filteredData.length,
    openOrders: filteredData.filter(order => 
      ['Aberto', 'Em Andamento', 'Pendente'].includes(order.situacao || '')
    ).length,
    avgFirstResponseHours: (() => {
      // Calculate average first response time (data_atendimento - data_chamado)
      const ordersWithResponse = filteredData.filter(order => 
        order.data_chamado && order.data_atendimento
      )
      
      if (ordersWithResponse.length === 0) return 0
      
      const totalResponseHours = ordersWithResponse.reduce((sum, order) => {
        const chamadoDate = new Date(order.data_chamado!)
        const atendimentoDate = new Date(order.data_atendimento!)
        
        // Calculate first response time in hours
        const responseTimeMs = atendimentoDate.getTime() - chamadoDate.getTime()
        const responseTimeHours = responseTimeMs / (1000 * 60 * 60)
        
        // Only include positive response times
        return responseTimeHours > 0 ? sum + responseTimeHours : sum
      }, 0)
      
      return totalResponseHours / ordersWithResponse.length
    })(),
    totalCost: filteredData.reduce((sum, order) => {
      return sum + 
        (order.custo_os || 0) + 
        (order.custo_mo || 0) + 
        (order.custo_peca || 0) + 
        (order.custo_servicoexterno || 0)
    }, 0),
    mtbf: (() => {
      // Step 1: Calculate F (Total Failures) - Count CORRETIVA maintenance orders
      const correctiveOrders = filteredData.filter(order => 
        order.tipomanutencao && 
        order.tipomanutencao.toUpperCase() === 'CORRETIVA'
      )
      const F = correctiveOrders.length
      
      if (F === 0) return 0 // No failures means infinite MTBF, but we'll return 0 for display
      
      // Step 2: Calculate N (Number of distinct equipment)
      const uniqueEquipment = new Set(
        filteredData
          .map(order => order.equipamento)
          .filter(equipment => equipment && equipment.trim() !== '')
      )
      const N = uniqueEquipment.size
      
      if (N === 0) return 0 // No equipment identified
      
      // Step 3: Calculate H (Total hours in the selected period)
      let H = 0
      
      // If abertura date filters are applied, calculate hours between them
      if (filters.aberturaStartDate && filters.aberturaEndDate) {
        const timeDiff = filters.aberturaEndDate.getTime() - filters.aberturaStartDate.getTime()
        H = timeDiff / (1000 * 60 * 60) // Convert to hours
      } else {
        // If no date filters, calculate from data span
        const dates = filteredData
          .map(order => order.abertura)
          .filter(date => date)
          .map(date => new Date(date!))
          .sort((a, b) => a.getTime() - b.getTime())
        
        if (dates.length >= 2) {
          const firstDate = dates[0]
          const lastDate = dates[dates.length - 1]
          H = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60)
        } else {
          // Default to 1 year (8760 hours) if can't determine period
          H = 8760
        }
      }
      
      // Step 4: Calculate T (Total Operation Time) = N × H
      const T = N * H
      
      // Step 5: Calculate MTBF = T / F
      const mtbfHours = T / F
      
      return mtbfHours
    })(),
    mttr: (() => {
      // Step 1: Filter for corrective maintenance orders only
      const correctiveOrders = filteredData.filter(order => 
        order.tipomanutencao && 
        order.tipomanutencao.toUpperCase() === 'CORRETIVA' &&
        order.data_chamado &&
        order.fechamento
      )
      
      // Step 2: Count total corrective maintenance orders (F)
      const F = correctiveOrders.length
      
      if (F === 0) return 0 // No corrective maintenance orders
      
      // Step 3: Calculate total repair time (ΣTr)
      const totalRepairTimeHours = correctiveOrders.reduce((sum, order) => {
        const chamadoDate = new Date(order.data_chamado!)
        const fechamentoDate = new Date(order.fechamento!)
        
        // Calculate repair time: fechamento - data_chamado
        const repairTimeMs = fechamentoDate.getTime() - chamadoDate.getTime()
        const repairTimeHours = repairTimeMs / (1000 * 60 * 60) // Convert to hours
        
        // Only include positive repair times (fechamento after chamado)
        return repairTimeHours > 0 ? sum + repairTimeHours : sum
      }, 0)
      
      // Step 4: Calculate MTTR = ΣTr / F
      const mttrHours = totalRepairTimeHours / F
      
      return mttrHours
    })(),
    taxaCumprimentoPlanejadas: (() => {
      // Step 1: Count total planned orders (causa = "PLANEJAMENTO")
      const plannedOrders = filteredData.filter(order => 
        order.causa && 
        order.causa.toUpperCase() === 'PLANEJAMENTO'
      )
      
      const totalPlanned = plannedOrders.length
      
      if (totalPlanned === 0) return 0 // No planned orders
      
      // Step 2: Count completed planned orders (causa = "PLANEJAMENTO" AND fechamento is not null/empty)
      const completedPlannedOrders = plannedOrders.filter(order => 
        order.fechamento && 
        order.fechamento.trim() !== ''
      )
      
      const totalCompleted = completedPlannedOrders.length
      
      // Step 3: Calculate completion rate = (completed / total) * 100
      const completionRate = (totalCompleted / totalPlanned) * 100
      
      return completionRate
    })(),
    taxaDisponibilidade: (() => {
      // Step 1: Calculate TTP (Tempo Total Possível)
      // Count distinct equipment based on "tag" column
      const uniqueEquipment = new Set(
        filteredData
          .map(order => order.tag)
          .filter(tag => tag && tag.trim() !== '')
      )
      const N = uniqueEquipment.size
      
      if (N === 0) return 0 // No equipment with tags identified
      
      // Step 2: Calculate H (Total hours in the selected period)
      let H = 0
      
      // If abertura date filters are applied, calculate hours between them
      if (filters.aberturaStartDate && filters.aberturaEndDate) {
        const timeDiff = filters.aberturaEndDate.getTime() - filters.aberturaStartDate.getTime()
        H = timeDiff / (1000 * 60 * 60) // Convert to hours
      } else {
        // If no date filters, calculate from data span
        const dates = filteredData
          .map(order => order.abertura)
          .filter(date => date)
          .map(date => new Date(date!))
          .sort((a, b) => a.getTime() - b.getTime())
        
        if (dates.length >= 2) {
          const firstDate = dates[0]
          const lastDate = dates[dates.length - 1]
          H = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60)
        } else {
          // Default to 1 year (8760 hours) if can't determine period
          H = 8760
        }
      }
      
      // Step 3: Calculate TTP = N × H
      const TTP = N * H
      
      // Step 4: Calculate TTI (Tempo Total Indisponível - Downtime)
      // Filter for corrective maintenance orders with both data_chamado and fechamento
      const correctiveOrders = filteredData.filter(order => 
        order.tipomanutencao && 
        order.tipomanutencao.toUpperCase() === 'CORRETIVA' &&
        order.data_chamado &&
        order.fechamento
      )
      
      // Sum the duration of all corrective maintenance orders
      const TTI = correctiveOrders.reduce((sum, order) => {
        const chamadoDate = new Date(order.data_chamado!)
        const fechamentoDate = new Date(order.fechamento!)
        
        // Calculate downtime: fechamento - data_chamado
        const downtimeMs = fechamentoDate.getTime() - chamadoDate.getTime()
        const downtimeHours = downtimeMs / (1000 * 60 * 60) // Convert to hours
        
        // Only include positive downtimes (fechamento after chamado)
        return downtimeHours > 0 ? sum + downtimeHours : sum
      }, 0)
      
      // Step 5: Calculate Taxa de Disponibilidade = (TTP - TTI) / TTP * 100
      if (TTP === 0) return 0
      const availability = ((TTP - TTI) / TTP) * 100
      
      return Math.max(0, Math.min(100, availability)) // Ensure between 0 and 100
    })()
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

  // Process filtered data for causa chart
  const causaData = (() => {
    const causaCount: Record<string, number> = {}
    
    filteredData.forEach(order => {
      const causa = order.causa || 'Não informado'
      causaCount[causa] = (causaCount[causa] || 0) + 1
    })

    const totalOrders = filteredData.length
    
    return Object.entries(causaCount)
      .map(([causa, count]) => ({
        causa,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  })()

  // Process filtered data for familia chart
  const familiaData = (() => {
    const familiaCount: Record<string, number> = {}
    
    filteredData.forEach(order => {
      const familia = order.familia || 'Não informado'
      familiaCount[familia] = (familiaCount[familia] || 0) + 1
    })

    const totalOrders = filteredData.length
    
    return Object.entries(familiaCount)
      .map(([familia, count]) => ({
        familia,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  })()

  // Process filtered data for tipomanutencao chart
  const tipoManutencaoData = (() => {
    const tipoCount: Record<string, number> = {}
    
    filteredData.forEach(order => {
      const tipo = order.tipomanutencao || 'Não informado'
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1
    })

    const totalOrders = filteredData.length
    
    return Object.entries(tipoCount)
      .map(([tipomanutencao, count]) => ({
        tipomanutencao,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  })()

  // Process filtered data for setor chart
  const setorData = (() => {
    const setorCount: Record<string, number> = {}
    
    filteredData.forEach(order => {
      const setor = order.setor || 'Não informado'
      setorCount[setor] = (setorCount[setor] || 0) + 1
    })

    const totalOrders = filteredData.length
    
    return Object.entries(setorCount)
      .map(([setor, count]) => ({
        setor,
        count,
        percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
  })()

  // Process filtered data for taxa cumprimento planejada chart
  const taxaCumprimentoPlanejadaData = (() => {
    // Get all maintenance types from planned orders
    const tiposManutencao = Array.from(new Set(
      filteredData
        .filter(order => order.causa && order.causa.toUpperCase() === 'PLANEJAMENTO')
        .map(order => order.tipomanutencao || 'Não informado')
    )).sort()

    // Process monthly data
    const monthlyData: Record<string, {
      opened: Record<string, number>
      closed: Record<string, number>
    }> = {}

    // Count opened planned orders by month and type
    filteredData
      .filter(order => 
        order.causa && 
        order.causa.toUpperCase() === 'PLANEJAMENTO' &&
        order.abertura
      )
      .forEach(order => {
        const date = new Date(order.abertura!)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const tipo = order.tipomanutencao || 'Não informado'
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { opened: {}, closed: {} }
        }
        monthlyData[monthKey].opened[tipo] = (monthlyData[monthKey].opened[tipo] || 0) + 1
      })

    // Count closed planned orders by month and type
    filteredData
      .filter(order => 
        order.causa && 
        order.causa.toUpperCase() === 'PLANEJAMENTO' &&
        order.fechamento
      )
      .forEach(order => {
        const date = new Date(order.fechamento!)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const tipo = order.tipomanutencao || 'Não informado'
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { opened: {}, closed: {} }
        }
        monthlyData[monthKey].closed[tipo] = (monthlyData[monthKey].closed[tipo] || 0) + 1
      })

    // Calculate rates for each month
    const result = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24) // Last 24 months
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`
        
        const monthResult: { month: string; monthDisplay: string; media: number; [key: string]: string | number } = {
          month,
          monthDisplay,
          media: 0
        }

        let totalOpened = 0
        let totalClosed = 0

        // Calculate rate for each maintenance type
        tiposManutencao.forEach(tipo => {
          const opened = data.opened[tipo] || 0
          const closed = data.closed[tipo] || 0
          const rate = opened > 0 ? (closed / opened) * 100 : 0
          
          monthResult[tipo] = rate
          totalOpened += opened
          totalClosed += closed
        })

        // Calculate overall average for this month
        monthResult.media = totalOpened > 0 ? (totalClosed / totalOpened) * 100 : 0

        return monthResult
      })

    return {
      data: result,
      tiposManutencao
    }
  })()

  // Identify currently unavailable equipment (corrective maintenance in progress)
  const equipamentosIndisponiveis = React.useMemo(() => {
    return filteredData.filter(order => 
      order.tipomanutencao && 
      order.tipomanutencao.toUpperCase() === 'CORRETIVA' &&
      order.data_chamado &&
      !order.fechamento // Not closed yet - still in progress
    ).map(order => ({
      id: order.id,
      equipamento: order.equipamento,
      tag: order.tag,
      setor: order.setor,
      data_chamado: order.data_chamado,
      responsavel: order.responsavel,
      causa: order.causa,
      prioridade: order.prioridade,
      os: order.os,
      empresa: order.empresa
    }))
  }, [filteredData])

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

        <FiltersSection
          filters={filters}
          filterOptions={filterOptions}
          onDateChange={handleDateChange}
          onSingleSelectChange={handleSingleSelectChange}
          onMultiSelectChange={handleMultiSelectChange}
          onClearFilters={clearFilters}
          dataRange={dataRange}
        />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && loadingProgress && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loadingProgress}
          <LinearProgress
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              borderRadius: 0,
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#1976d2',
              }
            }}
          />
        </Alert>
      )}

      {!isAdmin && userProfile?.company && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Visualizando dados da empresa: {userProfile.company.name}
        </Alert>
      )}

      {/* KPI Metrics */}
      <Box mb={4}>
        <KpiMetrics 
          data={kpiData} 
          loading={loading} 
          equipamentosIndisponiveis={equipamentosIndisponiveis}
        />
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

      {/* Taxa Cumprimento Planejada Chart */}
      <Box mb={4}>
        <TaxaCumprimentoPlanejadaChart 
          data={taxaCumprimentoPlanejadaData.data} 
          tiposManutencao={taxaCumprimentoPlanejadaData.tiposManutencao}
          loading={loading} 
        />
      </Box>

      {/* Analysis Charts */}
      {/* eslint-disable @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* @ts-ignore */}
        <Grid item xs={12} lg={6}>
          <CausaChart data={causaData} loading={loading} />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} lg={6}>
          <FamiliaChart data={familiaData} loading={loading} />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} lg={6}>
          <TipoManutencaoChart data={tipoManutencaoData} loading={loading} />
        </Grid>
        {/* @ts-ignore */}
        <Grid item xs={12} lg={6}>
          <SetorChart data={setorData} loading={loading} />
        </Grid>
      </Grid>
      {/* eslint-enable @typescript-eslint/ban-ts-comment */}

      {/* Data Summary */}
      {/* eslint-disable @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Grid container spacing={3}>
        {/* @ts-ignore */}
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

        {/* @ts-ignore */}
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
      {/* eslint-enable @typescript-eslint/ban-ts-comment */}

      {/* Data Table Section */}
      <Box mt={4}>
        <Accordion expanded={showDataTable} onChange={() => setShowDataTable(!showDataTable)}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="data-table-content"
            id="data-table-header"
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              '&:hover': { 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
              }
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