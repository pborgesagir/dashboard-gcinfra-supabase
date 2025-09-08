'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Grid,
  Alert,
  SelectChangeEvent,
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
  Download as DownloadIcon
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import FiltersSection from './FiltersSection'
import EquipmentCountByCompanyChart from './EquipmentCountByCompanyChart'
import CompanyStatusGauges from './CompanyStatusGauges'
import CompanyTrendChart from './CompanyTrendChart'
import MTBFBenchmarkingChart from './MTBFBenchmarkingChart'

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
  tipomanutencao: string[]
  situacao: string[]
  possuiChamado: string
}

export default function BenchmarkingDashboardContent() {
  const { userProfile, isAdmin } = useAuth()
  const [clinicalData, setClinicalData] = useState<MaintenanceOrder[]>([])
  const [buildingData, setBuildingData] = useState<MaintenanceOrder[]>([])
  const [allData, setAllData] = useState<MaintenanceOrder[]>([])
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
    tipomanutencao: [],
    situacao: [],
    possuiChamado: 'Todos'
  })

  // Get unique values for filter options from current data
  const filterOptions = {
    empresas: [...new Set(allData.map(item => item.empresa).filter(Boolean))] as string[],
    equipamentos: [...new Set(allData.map(item => item.equipamento).filter(Boolean))] as string[],
    familias: [...new Set(allData.map(item => item.familia).filter(Boolean))] as string[],
    prioridades: [...new Set(allData.map(item => item.prioridade).filter(Boolean))] as string[],
    setores: [...new Set(allData.map(item => item.setor).filter(Boolean))] as string[],
    tiposManutencao: [...new Set(allData.map(item => item.tipomanutencao).filter(Boolean))] as string[],
    situacoes: [...new Set(allData.map(item => item.situacao).filter(Boolean))] as string[]
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setLoadingProgress('Carregando dados...')

      // Fetch both clinical and building data
      const [clinicalResult, buildingResult] = await Promise.all([
        // Clinical data
        (async () => {
          let query = supabase
            .from('maintenance_orders')
            .select('*')
            .order('abertura', { ascending: false })

          if (!isAdmin && userProfile?.company_id) {
            query = query.eq('company_id', userProfile.company_id)
          }

          let allOrders: MaintenanceOrder[] = []
          let from = 0
          const batchSize = 1000
          let hasMore = true

          while (hasMore) {
            setLoadingProgress(`Carregando dados clínicos: ${allOrders.length.toLocaleString()} registros...`)
            
            const { data: batch, error } = await query.range(from, from + batchSize - 1)
            if (error) throw error
            
            if (batch && batch.length > 0) {
              allOrders = allOrders.concat(batch)
              from += batchSize
              hasMore = batch.length === batchSize
              
              if (allOrders.length > 10000) {
                await new Promise(resolve => setTimeout(resolve, 10))
              }
            } else {
              hasMore = false
            }
          }

          return allOrders
        })(),
        // Building data
        (async () => {
          let query = supabase
            .from('building_orders')
            .select('*')
            .order('abertura', { ascending: false })

          if (!isAdmin && userProfile?.company_id) {
            query = query.eq('company_id', userProfile.company_id)
          }

          let allOrders: MaintenanceOrder[] = []
          let from = 0
          const batchSize = 1000
          let hasMore = true

          while (hasMore) {
            setLoadingProgress(`Carregando dados prediais: ${allOrders.length.toLocaleString()} registros...`)
            
            const { data: batch, error } = await query.range(from, from + batchSize - 1)
            if (error) throw error
            
            if (batch && batch.length > 0) {
              allOrders = allOrders.concat(batch)
              from += batchSize
              hasMore = batch.length === batchSize
              
              if (allOrders.length > 10000) {
                await new Promise(resolve => setTimeout(resolve, 10))
              }
            } else {
              hasMore = false
            }
          }

          return allOrders
        })()
      ])

      setClinicalData(clinicalResult)
      setBuildingData(buildingResult)
      
      // Set initial data based on dataType
      const initialData = dataType === 'clinical' ? clinicalResult : buildingResult
      setAllData(initialData)
      setFilteredData(initialData)

      setLoadingProgress(`Carregados ${clinicalResult.length + buildingResult.length} registros no total!`)
    } catch (error: unknown) {
      console.error('Error fetching data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
      setLoadingProgress('')
    }
  }, [userProfile, isAdmin, dataType])

  // Update data when dataType changes
  useEffect(() => {
    if (clinicalData.length > 0 || buildingData.length > 0) {
      const newData = dataType === 'clinical' ? clinicalData : buildingData
      setAllData(newData)
      setFilteredData(newData)
    }
  }, [dataType, clinicalData, buildingData])

  // Apply all filters to the data
  const applyFilters = useCallback(() => {
    let filtered = [...allData]

    // Date range filter
    if (filters.aberturaStartDate || filters.aberturaEndDate) {
      filtered = filtered.filter(item => {
        if (!item.abertura) return false
        const itemDate = new Date(item.abertura)
        
        if (filters.aberturaStartDate && itemDate < filters.aberturaStartDate) return false
        if (filters.aberturaEndDate && itemDate > filters.aberturaEndDate) return false
        
        return true
      })
    }

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
  }, [allData, filters])

  // Filter change handlers
  const handleDateChange = (field: 'aberturaStartDate' | 'aberturaEndDate' | 'fechamentoStartDate' | 'fechamentoEndDate') => (date: Date | null) => {
    setFilters(prev => ({ ...prev, [field]: date }))
  }

  const handleSingleSelectChange = (field: 'possuiChamado') => (
    event: SelectChangeEvent<string>
  ) => {
    setFilters(prev => ({ ...prev, [field]: event.target.value }))
  }

  const handleMultiSelectChange = (field: 'empresa' | 'equipamento' | 'familia' | 'prioridade' | 'setor' | 'tipomanutencao' | 'situacao') => (
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
      tipomanutencao: [],
      situacao: [],
      possuiChamado: 'Todos'
    })
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
    link.setAttribute('download', `dados_benchmarking_${dataType}_${new Date().toISOString().split('T')[0]}.csv`)
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
    const dates = allData
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
  }, [allData])

  // Process data for equipment count by company
  const equipmentCountData = React.useMemo(() => {
    const companyEquipmentCount: Record<string, Set<string>> = {}
    
    filteredData.forEach(order => {
      if (order.empresa && order.tag) {
        if (!companyEquipmentCount[order.empresa]) {
          companyEquipmentCount[order.empresa] = new Set()
        }
        companyEquipmentCount[order.empresa].add(order.tag)
      }
    })

    const total = Object.values(companyEquipmentCount).reduce((sum, set) => sum + set.size, 0)

    return Object.entries(companyEquipmentCount)
      .map(([empresa, equipmentSet]) => ({
        empresa,
        equipmentCount: equipmentSet.size,
        percentage: total > 0 ? (equipmentSet.size / total) * 100 : 0
      }))
      .sort((a, b) => b.equipmentCount - a.equipmentCount)
  }, [filteredData])

  // Process data for company status gauges
  const companyStatusData = React.useMemo(() => {
    const statusByCompany: Record<string, { aberta: number; fechada: number; pendente: number; total: number }> = {}

    filteredData.forEach(order => {
      if (order.empresa) {
        if (!statusByCompany[order.empresa]) {
          statusByCompany[order.empresa] = { aberta: 0, fechada: 0, pendente: 0, total: 0 }
        }
        
        statusByCompany[order.empresa].total++
        
        const situacao = order.situacao?.toLowerCase() || ''
        if (['aberto', 'aberta'].includes(situacao)) {
          statusByCompany[order.empresa].aberta++
        } else if (['fechado', 'fechada', 'concluído', 'concluída', 'finalizado', 'finalizada'].includes(situacao)) {
          statusByCompany[order.empresa].fechada++
        } else if (['pendente', 'em andamento', 'em execução'].includes(situacao)) {
          statusByCompany[order.empresa].pendente++
        }
      }
    })

    return Object.entries(statusByCompany)
      .map(([empresa, counts]) => ({
        empresa,
        ...counts
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData])

  // Process data for OS trend by company
  const osTrendData = React.useMemo(() => {
    const monthlyData: Record<string, Record<string, number>> = {}
    const companies = new Set<string>()

    filteredData.forEach(order => {
      if (order.abertura && order.empresa) {
        companies.add(order.empresa)
        const date = new Date(order.abertura)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const [year, monthNum] = monthKey.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`

        if (!monthlyData[monthDisplay]) {
          monthlyData[monthDisplay] = {}
        }
        if (!monthlyData[monthDisplay][order.empresa]) {
          monthlyData[monthDisplay][order.empresa] = 0
        }
        monthlyData[monthDisplay][order.empresa]++
      }
    })

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/')
      const [monthB, yearB] = b.split('/')
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1)
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    }).slice(-24)

    const trendData = sortedMonths.map(month => {
      const monthData: Record<string, string | number> = { month, monthDisplay: month }
      Array.from(companies).forEach(company => {
        monthData[company] = monthlyData[month]?.[company] || 0
      })
      return monthData
    })

    return {
      data: trendData,
      companies: Array.from(companies)
    }
  }, [filteredData])

  // Process data for planned completion rate trend by company
  const plannedCompletionTrendData = React.useMemo(() => {
    const monthlyData: Record<string, Record<string, { opened: number; closed: number }>> = {}
    const companies = new Set<string>()

    // Count opened planned orders by month and company
    filteredData
      .filter(order => order.causa?.toUpperCase() === 'PLANEJAMENTO' && order.abertura && order.empresa)
      .forEach(order => {
        companies.add(order.empresa!)
        const date = new Date(order.abertura!)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const [year, monthNum] = monthKey.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`

        if (!monthlyData[monthDisplay]) {
          monthlyData[monthDisplay] = {}
        }
        if (!monthlyData[monthDisplay][order.empresa!]) {
          monthlyData[monthDisplay][order.empresa!] = { opened: 0, closed: 0 }
        }
        monthlyData[monthDisplay][order.empresa!].opened++
      })

    // Count closed planned orders by month and company
    filteredData
      .filter(order => order.causa?.toUpperCase() === 'PLANEJAMENTO' && order.fechamento && order.empresa)
      .forEach(order => {
        companies.add(order.empresa!)
        const date = new Date(order.fechamento!)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const [year, monthNum] = monthKey.split('-')
        const monthDisplay = `${monthNum}/${year.slice(-2)}`

        if (!monthlyData[monthDisplay]) {
          monthlyData[monthDisplay] = {}
        }
        if (!monthlyData[monthDisplay][order.empresa!]) {
          monthlyData[monthDisplay][order.empresa!] = { opened: 0, closed: 0 }
        }
        monthlyData[monthDisplay][order.empresa!].closed++
      })

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/')
      const [monthB, yearB] = b.split('/')
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1)
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    }).slice(-24)

    const trendData = sortedMonths.map(month => {
      const monthData: Record<string, string | number> = { month, monthDisplay: month }
      Array.from(companies).forEach(company => {
        const companyData = monthlyData[month]?.[company] || { opened: 0, closed: 0 }
        monthData[company] = companyData.opened > 0 ? (companyData.closed / companyData.opened) * 100 : 0
      })
      return monthData
    })

    return {
      data: trendData,
      companies: Array.from(companies)
    }
  }, [filteredData])

  // Process data for first response time trend by company
  const firstResponseTrendData = React.useMemo(() => {
    const monthlyData: Record<string, Record<string, { totalTime: number; count: number }>> = {}
    const companies = new Set<string>()

    filteredData.forEach(order => {
      if (order.data_chamado && order.data_atendimento && order.empresa) {
        companies.add(order.empresa)
        const chamadoDate = new Date(order.data_chamado)
        const atendimentoDate = new Date(order.data_atendimento)
        const responseTimeHours = (atendimentoDate.getTime() - chamadoDate.getTime()) / (1000 * 60 * 60)

        if (responseTimeHours > 0) {
          const monthKey = `${chamadoDate.getFullYear()}-${(chamadoDate.getMonth() + 1).toString().padStart(2, '0')}`
          const [year, monthNum] = monthKey.split('-')
          const monthDisplay = `${monthNum}/${year.slice(-2)}`

          if (!monthlyData[monthDisplay]) {
            monthlyData[monthDisplay] = {}
          }
          if (!monthlyData[monthDisplay][order.empresa]) {
            monthlyData[monthDisplay][order.empresa] = { totalTime: 0, count: 0 }
          }
          monthlyData[monthDisplay][order.empresa].totalTime += responseTimeHours
          monthlyData[monthDisplay][order.empresa].count++
        }
      }
    })

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/')
      const [monthB, yearB] = b.split('/')
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1)
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    }).slice(-24)

    const trendData = sortedMonths.map(month => {
      const monthData: Record<string, string | number> = { month, monthDisplay: month }
      Array.from(companies).forEach(company => {
        const companyData = monthlyData[month]?.[company]
        monthData[company] = companyData && companyData.count > 0 ? companyData.totalTime / companyData.count : 0
      })
      return monthData
    })

    return {
      data: trendData,
      companies: Array.from(companies)
    }
  }, [filteredData])

  // Process data for MTTR trend by company
  const mttrTrendData = React.useMemo(() => {
    const monthlyData: Record<string, Record<string, { totalTime: number; count: number }>> = {}
    const companies = new Set<string>()

    filteredData
      .filter(order => 
        order.tipomanutencao?.toUpperCase() === 'CORRETIVA' && 
        order.data_chamado && 
        order.fechamento && 
        order.empresa
      )
      .forEach(order => {
        companies.add(order.empresa!)
        const chamadoDate = new Date(order.data_chamado!)
        const fechamentoDate = new Date(order.fechamento!)
        const repairTimeHours = (fechamentoDate.getTime() - chamadoDate.getTime()) / (1000 * 60 * 60)

        if (repairTimeHours > 0) {
          const monthKey = `${chamadoDate.getFullYear()}-${(chamadoDate.getMonth() + 1).toString().padStart(2, '0')}`
          const [year, monthNum] = monthKey.split('-')
          const monthDisplay = `${monthNum}/${year.slice(-2)}`

          if (!monthlyData[monthDisplay]) {
            monthlyData[monthDisplay] = {}
          }
          if (!monthlyData[monthDisplay][order.empresa!]) {
            monthlyData[monthDisplay][order.empresa!] = { totalTime: 0, count: 0 }
          }
          monthlyData[monthDisplay][order.empresa!].totalTime += repairTimeHours
          monthlyData[monthDisplay][order.empresa!].count++
        }
      })

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/')
      const [monthB, yearB] = b.split('/')
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1)
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1)
      return dateA.getTime() - dateB.getTime()
    }).slice(-24)

    const trendData = sortedMonths.map(month => {
      const monthData: Record<string, string | number> = { month, monthDisplay: month }
      Array.from(companies).forEach(company => {
        const companyData = monthlyData[month]?.[company]
        monthData[company] = companyData && companyData.count > 0 ? companyData.totalTime / companyData.count : 0
      })
      return monthData
    })

    return {
      data: trendData,
      companies: Array.from(companies)
    }
  }, [filteredData])

  // Process data for MTBF benchmarking
  const mtbfBenchmarkingData = React.useMemo(() => {
    // MTBF by company
    const mtbfByCompany: Record<string, { failures: number; equipment: Set<string>; hours: number }> = {}
    
    // Calculate period hours
    let periodHours = 8760 // Default to 1 year
    if (filters.aberturaStartDate && filters.aberturaEndDate) {
      periodHours = (filters.aberturaEndDate.getTime() - filters.aberturaStartDate.getTime()) / (1000 * 60 * 60)
    } else {
      const dates = filteredData
        .map(order => order.abertura)
        .filter(date => date)
        .map(date => new Date(date!))
        .sort((a, b) => a.getTime() - b.getTime())
      
      if (dates.length >= 2) {
        periodHours = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60)
      }
    }

    filteredData.forEach(order => {
      if (order.empresa) {
        if (!mtbfByCompany[order.empresa]) {
          mtbfByCompany[order.empresa] = { failures: 0, equipment: new Set(), hours: periodHours }
        }

        if (order.tipomanutencao?.toUpperCase() === 'CORRETIVA') {
          mtbfByCompany[order.empresa].failures++
        }

        if (order.equipamento) {
          mtbfByCompany[order.empresa].equipment.add(order.equipamento)
        }
      }
    })

    const companyMTBF = Object.entries(mtbfByCompany)
      .map(([empresa, data]) => {
        const totalOperationTime = data.equipment.size * data.hours
        const mtbf = data.failures > 0 ? totalOperationTime / data.failures : 0
        return { empresa, mtbf }
      })
      .sort((a, b) => b.mtbf - a.mtbf)

    // MTBF by familia
    const mtbfByFamilia: Record<string, { failures: number; equipment: Set<string> }> = {}
    
    filteredData.forEach(order => {
      if (order.familia) {
        if (!mtbfByFamilia[order.familia]) {
          mtbfByFamilia[order.familia] = { failures: 0, equipment: new Set() }
        }

        if (order.tipomanutencao?.toUpperCase() === 'CORRETIVA') {
          mtbfByFamilia[order.familia].failures++
        }

        if (order.equipamento) {
          mtbfByFamilia[order.familia].equipment.add(order.equipamento)
        }
      }
    })

    const familiaMTBF = Object.entries(mtbfByFamilia)
      .map(([familia, data]) => {
        const totalOperationTime = data.equipment.size * periodHours
        const mtbf = data.failures > 0 ? totalOperationTime / data.failures : 0
        return { familia, mtbf }
      })
      .filter(item => item.mtbf > 0)
      .sort((a, b) => b.mtbf - a.mtbf)

    const topFamilias = familiaMTBF.slice(0, 5)
    const bottomFamilias = familiaMTBF.slice(-5).reverse()

    // Company stats (highest/lowest MTBF by familia for each company)
    const companyStats = Object.keys(mtbfByCompany).map(empresa => {
      const companyOrders = filteredData.filter(order => order.empresa === empresa)
      const companyFamiliaMTBF: Record<string, { failures: number; equipment: Set<string> }> = {}

      companyOrders.forEach(order => {
        if (order.familia) {
          if (!companyFamiliaMTBF[order.familia]) {
            companyFamiliaMTBF[order.familia] = { failures: 0, equipment: new Set() }
          }

          if (order.tipomanutencao?.toUpperCase() === 'CORRETIVA') {
            companyFamiliaMTBF[order.familia].failures++
          }

          if (order.equipamento) {
            companyFamiliaMTBF[order.familia].equipment.add(order.equipamento)
          }
        }
      })

      const companyFamiliaMTBFValues = Object.entries(companyFamiliaMTBF)
        .map(([familia, data]) => {
          const totalOperationTime = data.equipment.size * periodHours
          const mtbf = data.failures > 0 ? totalOperationTime / data.failures : 0
          return { familia, mtbf }
        })
        .filter(item => item.mtbf > 0)
        .sort((a, b) => b.mtbf - a.mtbf)

      return {
        empresa,
        highestMTBF: companyFamiliaMTBFValues.length > 0 ? companyFamiliaMTBFValues[0] : null,
        lowestMTBF: companyFamiliaMTBFValues.length > 0 ? companyFamiliaMTBFValues[companyFamiliaMTBFValues.length - 1] : null
      }
    })

    return {
      byCompany: companyMTBF,
      topFamilias,
      bottomFamilias,
      companyStats
    }
  }, [filteredData, filters])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Dashboard de Benchmarking
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

        {/* Equipment Count and Status Gauges */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <EquipmentCountByCompanyChart 
              data={equipmentCountData}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CompanyStatusGauges 
              data={companyStatusData}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* OS Trend Chart */}
        <Box mb={4}>
          <CompanyTrendChart
            data={osTrendData.data as any}
            companies={osTrendData.companies}
            loading={loading}
            title="Tendência da Quantidade de OS ao Longo do Tempo"
            yAxisTitle="Quantidade de OS"
          />
        </Box>

        {/* Planned Completion Rate Trend */}
        <Box mb={4}>
          <CompanyTrendChart
            data={plannedCompletionTrendData.data as any}
            companies={plannedCompletionTrendData.companies}
            loading={loading}
            title="Taxa Mensal de Cumprimento de OS Planejadas"
            yAxisTitle="Taxa de Cumprimento (%)"
            showAverage={true}
          />
        </Box>

        {/* First Response Time Trend */}
        <Box mb={4}>
          <CompanyTrendChart
            data={firstResponseTrendData.data as any}
            companies={firstResponseTrendData.companies}
            loading={loading}
            title="Tendência do Tempo Médio de Primeira Resposta"
            yAxisTitle="Tempo de Resposta (horas)"
            showAverage={true}
          />
        </Box>

        {/* MTTR Trend */}
        <Box mb={4}>
          <CompanyTrendChart
            data={mttrTrendData.data as any}
            companies={mttrTrendData.companies}
            loading={loading}
            title="MTTR - Tempo Médio de Reparo"
            yAxisTitle="MTTR (horas)"
            showAverage={true}
          />
        </Box>

        {/* MTBF Benchmarking */}
        <Box mb={4}>
          <MTBFBenchmarkingChart 
            data={mtbfBenchmarkingData}
            loading={loading}
          />
        </Box>

        {/* Export Section */}
        <Box mt={4}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="export-content"
              id="export-header"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Box flexGrow={1}>
                  <Typography variant="h6">
                    Exportador de Dados Filtrados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Exporte os dados filtrados em formato CSV ({filteredData.length.toLocaleString('pt-BR')} registros)
                  </Typography>
                </Box>
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
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Typography color="text.secondary">
                O arquivo CSV incluirá todos os dados filtrados atualmente visíveis no dashboard, 
                permitindo análises mais detalhadas em ferramentas externas como Excel ou Power BI.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </LocalizationProvider>
  )
}