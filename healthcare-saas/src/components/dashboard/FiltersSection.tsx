"use client";
/* eslint-disable @typescript-eslint/ban-ts-comment */

import React from "react";
import {
  Paper,
  Typography,
  Grid,
  FormControl,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Box,
  Chip,
  Tooltip,
  IconButton,
  Badge,
  Button,
  ButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { SelectChangeEvent } from "@mui/material/Select";
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";

interface FilterState {
  aberturaStartDate: Date | null;
  aberturaEndDate: Date | null;
  fechamentoStartDate: Date | null;
  fechamentoEndDate: Date | null;
  empresa: string[];
  equipamento: string[];
  familia: string[];
  prioridade: string[];
  setor: string[];
  oficina: string[];
  tipomanutencao: string[];
  situacao: string[];
  possuiChamado: string;
}

interface FilterOptions {
  empresas: string[];
  equipamentos: string[];
  familias: string[];
  prioridades: string[];
  setores: string[];
  oficinas: string[];
  tiposManutencao: string[];
  situacoes: string[];
}

interface DataRange {
  start: Date;
  end: Date;
}

interface FiltersSectionProps {
  filters: FilterState;
  filterOptions: FilterOptions;
  onDateChange: (
    field:
      | "aberturaStartDate"
      | "aberturaEndDate"
      | "fechamentoStartDate"
      | "fechamentoEndDate"
  ) => (date: Date | null) => void;
  onSingleSelectChange: (
    field: "possuiChamado"
  ) => (event: SelectChangeEvent<string>) => void;
  onMultiSelectChange: (
    field:
      | "empresa"
      | "equipamento"
      | "familia"
      | "prioridade"
      | "setor"
      | "oficina"
      | "tipomanutencao"
      | "situacao"
  ) => (event: SelectChangeEvent<string[]>) => void;
  onClearFilters: () => void;
  dataRange: DataRange | null;
  onLoadOlderData?: (dateRange: { start: Date; end: Date }) => void;
  onPeriodSelect?: (period: 'month' | 'quarter' | 'semester') => void;
}

export default function FiltersSection({
  filters,
  filterOptions,
  onDateChange,
  onSingleSelectChange,
  onMultiSelectChange,
  onClearFilters,
  dataRange,
  onLoadOlderData,
  onPeriodSelect,
}: FiltersSectionProps) {
  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.aberturaStartDate || filters.aberturaEndDate) count++;
    if (filters.fechamentoStartDate || filters.fechamentoEndDate) count++;
    if (filters.empresa.length > 0) count++;
    if (filters.equipamento.length > 0) count++;
    if (filters.familia.length > 0) count++;
    if (filters.prioridade.length > 0) count++;
    if (filters.setor.length > 0) count++;
    if (filters.oficina.length > 0) count++;
    if (filters.tipomanutencao.length > 0) count++;
    if (filters.situacao.length > 0) count++;
    if (filters.possuiChamado !== "Todos") count++;
    return count;
  }, [filters]);

  // Check if user is trying to access data outside current range
  const needsOlderData = React.useMemo(() => {
    if (!dataRange || !onLoadOlderData) return false;

    const currentStart = dataRange.start;
    const currentEnd = dataRange.end;

    // Check if any date filter is outside the current range
    if (filters.aberturaStartDate && filters.aberturaStartDate < currentStart) return true;
    if (filters.aberturaEndDate && filters.aberturaEndDate < currentStart) return true;
    if (filters.fechamentoStartDate && filters.fechamentoStartDate < currentStart) return true;
    if (filters.fechamentoEndDate && filters.fechamentoEndDate < currentStart) return true;

    return false;
  }, [filters, dataRange, onLoadOlderData]);

  // Calculate required date range for older data
  const requiredDateRange = React.useMemo(() => {
    if (!needsOlderData || !dataRange) return null;

    const dates = [
      filters.aberturaStartDate,
      filters.aberturaEndDate,
      filters.fechamentoStartDate,
      filters.fechamentoEndDate
    ].filter(date => date !== null) as Date[];

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      start: minDate < dataRange.start ? minDate : dataRange.start,
      end: maxDate > dataRange.end ? maxDate : dataRange.end
    };
  }, [needsOlderData, dataRange, filters]);

  const renderMultiSelect = (
    field: keyof Pick<
      FilterState,
      | "empresa"
      | "equipamento"
      | "familia"
      | "prioridade"
      | "setor"
      | "oficina"
      | "tipomanutencao"
      | "situacao"
    >,
    options: string[],
    color: string
  ) => (
    <FormControl fullWidth size="small">
      <Select
        multiple
        displayEmpty
        value={filters[field] as string[]}
        onChange={onMultiSelectChange(field)}
        input={<OutlinedInput />}
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <Typography variant="body2" color="text.secondary">Todos</Typography>;
          }
          if (selected.length <= 2) {
            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    size="small"
                    sx={{
                      bgcolor: `${color}15`,
                      color: color,
                      fontWeight: "medium",
                    }}
                  />
                ))}
              </Box>
            );
          }
          return (
            <Chip
              label={`${selected.length} selecionados`}
              size="small"
              sx={{
                bgcolor: `${color}15`,
                color: color,
                fontWeight: "bold",
              }}
            />
          );
        }}
        sx={{
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor:
              (filters[field] as string[]).length > 0 ? color : undefined,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: `${color}80`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: color,
          },
        }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox
              checked={(filters[field] as string[]).indexOf(option) > -1}
              sx={{ color: color }}
            />
            <ListItemText
              primary={option}
              sx={{
                "& .MuiListItemText-primary": {
                  fontSize: "0.875rem",
                  fontWeight:
                    (filters[field] as string[]).indexOf(option) > -1
                      ? "medium"
                      : "normal",
                },
              }}
            />
          </MenuItem>
        ))}
        {options.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhum dado disponível
            </Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );

  return (
    <Paper
      elevation={2}
      sx={{
        p: 0,
        mb: 4,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header da Seção de Filtros */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={activeFiltersCount} color="primary">
              <FilterListIcon sx={{ color: "primary.main", fontSize: 28 }} />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Filtros Avançados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeFiltersCount === 0
                  ? `Mostrando dados${
                      dataRange
                        ? ` de ${dataRange.start.toLocaleDateString(
                            "pt-BR"
                          )} até ${dataRange.end.toLocaleDateString("pt-BR")}`
                        : ""
                    }`
                  : `${activeFiltersCount} ${
                      activeFiltersCount === 1
                        ? "filtro ativo"
                        : "filtros ativos"
                    }${
                      dataRange
                        ? ` - mostrando dados de ${dataRange.start.toLocaleDateString(
                            "pt-BR"
                          )} até ${dataRange.end.toLocaleDateString("pt-BR")}`
                        : ""
                    }`}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {needsOlderData && requiredDateRange && (
              <Tooltip title="Carregar dados mais antigos para as datas selecionadas">
                <IconButton
                  onClick={() => onLoadOlderData?.(requiredDateRange)}
                  sx={{
                    bgcolor: "warning.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "warning.dark",
                    },
                  }}
                >
                  <CloudDownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Limpar todos os filtros">
              <IconButton
                onClick={onClearFilters}
                disabled={activeFiltersCount === 0}
                sx={{
                  bgcolor:
                    activeFiltersCount > 0 ? "error.main" : "action.disabled",
                  color: "white",
                  "&:hover": {
                    bgcolor:
                      activeFiltersCount > 0 ? "error.dark" : "action.disabled",
                  },
                  "&:disabled": {
                    bgcolor: "action.disabled",
                    color: "action.disabled",
                  },
                }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* @ts-ignore */}
        <Grid container spacing={3}>
          {/* Linha 1: Filtros de Data */}
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Abertura - Data Inicial
            </Typography>
            <DatePicker
              value={filters.aberturaStartDate}
              onChange={onDateChange("aberturaStartDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Abertura - Data Final
            </Typography>
            <DatePicker
              value={filters.aberturaEndDate}
              onChange={onDateChange("aberturaEndDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Fechamento - Data Inicial
            </Typography>
            <DatePicker
              value={filters.fechamentoStartDate}
              onChange={onDateChange("fechamentoStartDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Fechamento - Data Final
            </Typography>
            <DatePicker
              value={filters.fechamentoEndDate}
              onChange={onDateChange("fechamentoEndDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Grid>

          {/* Linha 2: Filtros Gerais */}
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Empresas
            </Typography>
            {renderMultiSelect("empresa", filterOptions.empresas, "#9c27b0")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Setores
            </Typography>
            {renderMultiSelect("setor", filterOptions.setores, "#2196f3")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Oficinas
            </Typography>
            {renderMultiSelect("oficina", filterOptions.oficinas, "#00bcd4")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Equipamentos
            </Typography>
            {renderMultiSelect(
              "equipamento",
              filterOptions.equipamentos,
              "#ff9800"
            )}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Famílias
            </Typography>
            {renderMultiSelect("familia", filterOptions.familias, "#4caf50")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Typography variant="caption" display="block" gutterBottom>
              Tipos de Manutenção
            </Typography>
            {renderMultiSelect(
              "tipomanutencao",
              filterOptions.tiposManutencao,
              "#f44336"
            )}
          </Grid>

          {/* Linha 3: Status e outros */}
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Situações
            </Typography>
            {renderMultiSelect("situacao", filterOptions.situacoes, "#607d8b")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Prioridades
            </Typography>
            {renderMultiSelect("prioridade", filterOptions.prioridades, "#e91e63")}
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" display="block" gutterBottom>
              Possui Chamado
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.possuiChamado}
                onChange={onSingleSelectChange("possuiChamado")}
                displayEmpty
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Sim">Sim</MenuItem>
                <MenuItem value="Não">Não</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Period Selection Buttons */}
          {onPeriodSelect && (
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" display="block" gutterBottom>
                Períodos Rápidos
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onPeriodSelect('month')}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }
                  }}
                >
                  1M
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onPeriodSelect('quarter')}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderColor: 'secondary.main',
                    color: 'secondary.main',
                    '&:hover': {
                      backgroundColor: 'secondary.main',
                      color: 'white',
                    }
                  }}
                >
                  3M
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onPeriodSelect('semester')}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      backgroundColor: 'success.main',
                      color: 'white',
                    }
                  }}
                >
                  6M
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
}