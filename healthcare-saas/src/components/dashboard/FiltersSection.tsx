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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { SelectChangeEvent } from "@mui/material/Select";
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
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
}

export default function FiltersSection({
  filters,
  filterOptions,
  onDateChange,
  onSingleSelectChange,
  onMultiSelectChange,
  onClearFilters,
  dataRange,
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
                  ? `Nenhum filtro aplicado - mostrando todos os dados${
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
                    }`}
              </Typography>
            </Box>
          </Box>
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
        </Grid>
      </Box>
    </Paper>
  );
}