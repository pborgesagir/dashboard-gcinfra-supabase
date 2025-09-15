'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface MaintenanceOrder {
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

interface DataState {
  clinicalData: MaintenanceOrder[]
  buildingData: MaintenanceOrder[]
  clinicalLoading: boolean
  buildingLoading: boolean
  clinicalError: string | null
  buildingError: string | null
  clinicalLoaded: boolean
  buildingLoaded: boolean
  loadingProgress: string
  estimatedTimeRemaining: string
}

interface DataContextType extends DataState {
  loadClinicalData: () => Promise<MaintenanceOrder[]>
  loadBuildingData: () => Promise<MaintenanceOrder[]>
  clearCache: () => void
  refreshData: (type?: 'clinical' | 'building' | 'both') => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const { userProfile, isAdmin } = useAuth()
  const [state, setState] = useState<DataState>({
    clinicalData: [],
    buildingData: [],
    clinicalLoading: false,
    buildingLoading: false,
    clinicalError: null,
    buildingError: null,
    clinicalLoaded: false,
    buildingLoaded: false,
    loadingProgress: '',
    estimatedTimeRemaining: ''
  })

  const updateState = useCallback((updates: Partial<DataState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const fetchDataWithPagination = useCallback(async (
    table: 'maintenance_orders' | 'building_orders',
    onProgress: (progress: string, timeEstimate: string) => void
  ): Promise<MaintenanceOrder[]> => {
    let query = supabase
      .from(table)
      .select('*')
      .order('abertura', { ascending: false })

    // Apply company filter for non-admin users
    if (!isAdmin && userProfile?.company_id) {
      query = query.eq('company_id', userProfile.company_id)
    }

    let allOrders: MaintenanceOrder[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true
    const startTime = Date.now()

    while (hasMore) {
      const dataType = table === 'maintenance_orders' ? 'clínicos' : 'prediais'
      const { data: batch, error } = await query.range(from, from + batchSize - 1)

      if (error) throw error

      if (batch && batch.length > 0) {
        allOrders = allOrders.concat(batch)
        from += batchSize
        hasMore = batch.length === batchSize

        // Calculate time estimation after processing the batch
        const currentTime = Date.now()
        const elapsedTime = currentTime - startTime
        let timeEstimate = ''

        if (allOrders.length > 0 && elapsedTime > 1000) { // Only estimate after 1 second
          const recordsProcessed = allOrders.length
          const batchesProcessed = Math.ceil(recordsProcessed / batchSize)

          if (hasMore && batchesProcessed >= 2) {
            // Simple approach: assume we're about 30-70% done based on consistent batch sizes
            // This provides a reasonable decreasing estimate
            const avgTimePerBatch = elapsedTime / batchesProcessed

            // Estimate remaining batches based on typical patterns
            // If we're getting consistent full batches, assume 2-5 more batches
            let estimatedBatchesRemaining = Math.max(1, Math.floor(batchesProcessed * 0.4))

            // Cap the estimate to prevent unrealistic times
            estimatedBatchesRemaining = Math.min(estimatedBatchesRemaining, 8)

            const estimatedRemainingTime = estimatedBatchesRemaining * avgTimePerBatch

            if (estimatedBatchesRemaining <= 1 || batch.length < batchSize) {
              timeEstimate = 'Quase concluído...'
            } else if (estimatedRemainingTime > 60000) {
              const minutes = Math.ceil(estimatedRemainingTime / 60000)
              timeEstimate = `Faltam aproximadamente ${minutes}min`
            } else if (estimatedRemainingTime > 3000) {
              const seconds = Math.ceil(estimatedRemainingTime / 1000)
              timeEstimate = `Faltam aproximadamente ${seconds}s`
            } else {
              timeEstimate = 'Quase concluído...'
            }
          } else if (hasMore) {
            // Early estimation - just show that we're calculating
            timeEstimate = 'Calculando tempo restante...'
          } else {
            timeEstimate = 'Quase concluído...'
          }
        }

        onProgress(`Carregando dados ${dataType}: ${allOrders.length.toLocaleString()} registros...`, timeEstimate)

        // Add small delay for large datasets to prevent blocking UI
        if (allOrders.length > 10000) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      } else {
        hasMore = false
      }
    }

    return allOrders
  }, [userProfile, isAdmin])

  const loadClinicalData = useCallback(async (): Promise<MaintenanceOrder[]> => {
    // Return cached data if already loaded
    if (state.clinicalLoaded && !state.clinicalLoading && state.clinicalData.length > 0) {
      return state.clinicalData
    }

    // Prevent multiple concurrent loads
    if (state.clinicalLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!state.clinicalLoading) {
            resolve(state.clinicalData)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    try {
      updateState({
        clinicalLoading: true,
        clinicalError: null,
        loadingProgress: 'Iniciando carregamento de dados clínicos...',
        estimatedTimeRemaining: ''
      })

      const data = await fetchDataWithPagination('maintenance_orders', (progress, timeEstimate) => {
        updateState({
          loadingProgress: progress,
          estimatedTimeRemaining: timeEstimate
        })
      })

      updateState({
        clinicalData: data,
        clinicalLoading: false,
        clinicalLoaded: true,
        clinicalError: null,
        loadingProgress: `Carregados ${data.length.toLocaleString()} registros clínicos com sucesso!`,
        estimatedTimeRemaining: ''
      })

      // Clear progress message after 2 seconds
      setTimeout(() => {
        updateState({ loadingProgress: '', estimatedTimeRemaining: '' })
      }, 2000)

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados clínicos'
      updateState({
        clinicalLoading: false,
        clinicalError: errorMessage,
        loadingProgress: '',
        estimatedTimeRemaining: ''
      })
      throw error
    }
  }, [state.clinicalLoaded, state.clinicalLoading, state.clinicalData, fetchDataWithPagination, updateState])

  const loadBuildingData = useCallback(async (): Promise<MaintenanceOrder[]> => {
    // Return cached data if already loaded
    if (state.buildingLoaded && !state.buildingLoading && state.buildingData.length > 0) {
      return state.buildingData
    }

    // Prevent multiple concurrent loads
    if (state.buildingLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!state.buildingLoading) {
            resolve(state.buildingData)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    try {
      updateState({
        buildingLoading: true,
        buildingError: null,
        loadingProgress: 'Iniciando carregamento de dados prediais...',
        estimatedTimeRemaining: ''
      })

      const data = await fetchDataWithPagination('building_orders', (progress, timeEstimate) => {
        updateState({
          loadingProgress: progress,
          estimatedTimeRemaining: timeEstimate
        })
      })

      updateState({
        buildingData: data,
        buildingLoading: false,
        buildingLoaded: true,
        buildingError: null,
        loadingProgress: `Carregados ${data.length.toLocaleString()} registros prediais com sucesso!`,
        estimatedTimeRemaining: ''
      })

      // Clear progress message after 2 seconds
      setTimeout(() => {
        updateState({ loadingProgress: '', estimatedTimeRemaining: '' })
      }, 2000)

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados prediais'
      updateState({
        buildingLoading: false,
        buildingError: errorMessage,
        loadingProgress: '',
        estimatedTimeRemaining: ''
      })
      throw error
    }
  }, [state.buildingLoaded, state.buildingLoading, state.buildingData, fetchDataWithPagination, updateState])

  const clearCache = useCallback(() => {
    setState({
      clinicalData: [],
      buildingData: [],
      clinicalLoading: false,
      buildingLoading: false,
      clinicalError: null,
      buildingError: null,
      clinicalLoaded: false,
      buildingLoaded: false,
      loadingProgress: '',
      estimatedTimeRemaining: ''
    })
  }, [])

  const refreshData = useCallback(async (type: 'clinical' | 'building' | 'both' = 'both') => {
    if (type === 'clinical' || type === 'both') {
      updateState({
        clinicalLoaded: false,
        clinicalData: [],
        clinicalError: null,
        estimatedTimeRemaining: ''
      })
      await loadClinicalData()
    }
    
    if (type === 'building' || type === 'both') {
      updateState({
        buildingLoaded: false,
        buildingData: [],
        buildingError: null,
        estimatedTimeRemaining: ''
      })
      await loadBuildingData()
    }
  }, [loadClinicalData, loadBuildingData, updateState])

  const contextValue: DataContextType = {
    ...state,
    loadClinicalData,
    loadBuildingData,
    clearCache,
    refreshData
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextType {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}