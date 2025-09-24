import { useMemo } from 'react'

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

interface ActiveFilter {
  label: string
  value: string
}

export function useActiveFilters(filters: FilterState) {
  return useMemo(() => {
    const activeFilters: ActiveFilter[] = []

    // Date filters
    if (filters.aberturaStartDate) {
      activeFilters.push({
        label: 'Data Abertura (Início)',
        value: filters.aberturaStartDate.toLocaleDateString('pt-BR')
      })
    }

    if (filters.aberturaEndDate) {
      activeFilters.push({
        label: 'Data Abertura (Fim)',
        value: filters.aberturaEndDate.toLocaleDateString('pt-BR')
      })
    }

    if (filters.fechamentoStartDate) {
      activeFilters.push({
        label: 'Data Fechamento (Início)',
        value: filters.fechamentoStartDate.toLocaleDateString('pt-BR')
      })
    }

    if (filters.fechamentoEndDate) {
      activeFilters.push({
        label: 'Data Fechamento (Fim)',
        value: filters.fechamentoEndDate.toLocaleDateString('pt-BR')
      })
    }

    // Multi-select filters
    if (filters.empresa.length > 0) {
      activeFilters.push({
        label: 'Empresas',
        value: filters.empresa.join(', ')
      })
    }

    if (filters.equipamento.length > 0) {
      activeFilters.push({
        label: 'Equipamentos',
        value: filters.equipamento.length > 3
          ? `${filters.equipamento.slice(0, 3).join(', ')} e mais ${filters.equipamento.length - 3}`
          : filters.equipamento.join(', ')
      })
    }

    if (filters.familia.length > 0) {
      activeFilters.push({
        label: 'Famílias',
        value: filters.familia.length > 3
          ? `${filters.familia.slice(0, 3).join(', ')} e mais ${filters.familia.length - 3}`
          : filters.familia.join(', ')
      })
    }

    if (filters.prioridade.length > 0) {
      activeFilters.push({
        label: 'Prioridades',
        value: filters.prioridade.join(', ')
      })
    }

    if (filters.setor.length > 0) {
      activeFilters.push({
        label: 'Setores',
        value: filters.setor.length > 3
          ? `${filters.setor.slice(0, 3).join(', ')} e mais ${filters.setor.length - 3}`
          : filters.setor.join(', ')
      })
    }

    if (filters.oficina.length > 0) {
      activeFilters.push({
        label: 'Oficinas',
        value: filters.oficina.join(', ')
      })
    }

    if (filters.tipomanutencao.length > 0) {
      activeFilters.push({
        label: 'Tipos de Manutenção',
        value: filters.tipomanutencao.join(', ')
      })
    }

    if (filters.situacao.length > 0) {
      activeFilters.push({
        label: 'Situações',
        value: filters.situacao.join(', ')
      })
    }

    if (filters.possuiChamado !== 'Todos') {
      activeFilters.push({
        label: 'Possui Chamado',
        value: filters.possuiChamado
      })
    }

    return activeFilters
  }, [filters])
}