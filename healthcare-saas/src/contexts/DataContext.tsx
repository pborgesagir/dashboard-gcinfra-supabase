"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MaintenanceOrder {
  id: number;
  empresa: string | null;
  os: string | null;
  equipamento: string | null;
  situacao: string | null;
  abertura: string | null;
  fechamento: string | null;
  prioridade: string | null;
  setor: string | null;
  oficina: string | null;
  tipomanutencao: string | null;
  data_chamado: string | null;
  data_atendimento: string | null;
  responsavel: string | null;
  solicitante: string | null;
  causa: string | null;
  familia: string | null;
  tag: string | null;
  custo_os: number | null;
  custo_mo: number | null;
  custo_peca: number | null;
  custo_servicoexterno: number | null;
  company_id: string | null;
}

interface DataState {
  clinicalData: MaintenanceOrder[];
  buildingData: MaintenanceOrder[];
  clinicalLoading: boolean;
  buildingLoading: boolean;
  clinicalError: string | null;
  buildingError: string | null;
  clinicalLoaded: boolean;
  buildingLoaded: boolean;
  loadingProgress: string;
  loadingPercentage: number;
  dataDateRange: {
    start: Date;
    end: Date;
  } | null;
}

interface DataContextType extends DataState {
  loadClinicalData: (dateRange?: { start: Date; end: Date }) => Promise<MaintenanceOrder[]>;
  loadBuildingData: (dateRange?: { start: Date; end: Date }) => Promise<MaintenanceOrder[]>;
  clearCache: () => void;
  refreshData: (type?: "clinical" | "building" | "both", dateRange?: { start: Date; end: Date }) => Promise<void>;
  loadAdditionalData: (type: "clinical" | "building" | "both", dateRange: { start: Date; end: Date }) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { userProfile, isAdmin } = useAuth();
  const [state, setState] = useState<DataState>({
    clinicalData: [],
    buildingData: [],
    clinicalLoading: false,
    buildingLoading: false,
    clinicalError: null,
    buildingError: null,
    clinicalLoaded: false,
    buildingLoaded: false,
    loadingProgress: "",
    loadingPercentage: 0,
    dataDateRange: null,
  });

  const updateState = useCallback((updates: Partial<DataState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Fallback function for building_orders that works without count
  const fetchBuildingDataWithoutCount = useCallback(
    async (
      onProgress: (progress: string, percentage: number) => void,
      dateRange?: { start: Date; end: Date }
    ): Promise<MaintenanceOrder[]> => {
      console.log('🏗️ Using building_orders fallback method without count');

      const hasCompanyFilter = !isAdmin && userProfile?.company_id;
      const hasDateFilter = dateRange && dateRange.start && dateRange.end &&
                           dateRange.start instanceof Date && dateRange.end instanceof Date;

      let startDate: string | null = null;
      let endDate: string | null = null;

      if (hasDateFilter) {
        startDate = dateRange.start.toISOString().split('T')[0];
        endDate = dateRange.end.toISOString().split('T')[0];
      }

      let dataQuery = supabase.from("building_orders").select("*").order("abertura", { ascending: false });

      if (hasCompanyFilter) {
        dataQuery = dataQuery.eq("company_id", userProfile.company_id);
      }

      if (hasDateFilter && startDate && endDate) {
        dataQuery = dataQuery.gte("abertura", startDate).lte("abertura", endDate);
      }

      onProgress("Carregando dados prediais...", 50);

      const { data, error } = await dataQuery;

      if (error) {
        console.error('❌ Building data query error:', error);
        throw error;
      }

      onProgress(`Carregados ${data?.length || 0} registros prediais com sucesso!`, 100);

      return data || [];
    },
    [userProfile, isAdmin]
  );

  const fetchDataWithPagination = useCallback(
    async (
      table: "maintenance_orders" | "building_orders",
      onProgress: (progress: string, percentage: number) => void,
      dateRange?: { start: Date; end: Date }
    ): Promise<MaintenanceOrder[]> => {
      console.log(`🚀 fetchDataWithPagination called for ${table} with dateRange:`, dateRange);
      console.log('📊 Call stack trace:', new Error().stack?.split('\n').slice(1, 4));

      // Special handling for building_orders debugging
      if (table === "building_orders") {
        console.log('🏗️ Processing building_orders with special attention');
        console.log('🏗️ UserProfile:', userProfile);
        console.log('🏗️ IsAdmin:', isAdmin);
        console.log('🏗️ HasCompanyFilter:', !isAdmin && userProfile?.company_id);
        console.log('🏗️ DateRange provided:', dateRange);
      }

      // Preparar filtros uma vez
      const hasCompanyFilter = !isAdmin && userProfile?.company_id;
      const hasDateFilter = dateRange && dateRange.start && dateRange.end &&
                           dateRange.start instanceof Date && dateRange.end instanceof Date;

      let startDate: string | null = null;
      let endDate: string | null = null;

      if (hasDateFilter) {
        startDate = dateRange.start.toISOString().split('T')[0];
        endDate = dateRange.end.toISOString().split('T')[0];
        console.log(`Applying date filter to ${table}: ${startDate} to ${endDate}`);
      } else {
        console.log(`No valid date range for ${table}, loading all data`);
      }

      // 1. OBTER A CONTAGEM TOTAL DE REGISTROS COM FILTROS
      // Create a fresh query builder for count
      console.log(`🔍 Building count query for table: ${table}`);

      // Check if table exists and is accessible
      try {
        console.log(`🔍 Testing basic access to ${table}...`);
        const testQuery = await supabase.from(table).select("id").limit(1);
        console.log(`✅ Table ${table} basic access:`, testQuery.error ? 'FAILED' : 'SUCCESS');
        console.log(`📊 Test query result:`, testQuery);

        if (testQuery.error) {
          console.error(`❌ Table access error for ${table}:`, JSON.stringify(testQuery.error, null, 2));
          // If we can't even access the table, return empty array
          if (table === "building_orders") {
            console.log('🏗️ building_orders access failed, returning empty array');
            return [];
          }
        } else {
          console.log(`✅ ${table} accessible, got ${testQuery.data?.length || 0} sample records`);
        }
      } catch (err) {
        console.error(`❌ Exception checking table ${table}:`, err);
        if (table === "building_orders") {
          console.log('🏗️ building_orders exception, returning empty array');
          return [];
        }
      }

      let countQuery = supabase.from(table).select("*", { count: "exact", head: true });

      if (hasCompanyFilter) {
        console.log(`🔍 Applying company filter for ${table}: ${userProfile.company_id}`);
        try {
          countQuery = countQuery.eq("company_id", userProfile.company_id);
          console.log(`✅ Applied company filter to count query: ${userProfile.company_id}`);
        } catch (err) {
          console.error(`❌ Error applying company filter to ${table}:`, err);
          // Continue without company filter if it fails
        }
      }

      if (hasDateFilter && startDate && endDate) {
        console.log(`🔍 Applying date filter for ${table}: ${startDate} to ${endDate}`);
        try {
          countQuery = countQuery.gte("abertura", startDate).lte("abertura", endDate);
          console.log(`✅ Applied date filter to count query: ${startDate} to ${endDate}`);
        } catch (err) {
          console.error(`❌ Error applying date filter to ${table}:`, err);
          console.error(`❌ Date filter details:`, { startDate, endDate, hasDateFilter });
          // Continue without date filter if it fails
        }
      }

      console.log(`Executing count query for ${table} with filters:`, {
        hasCompanyFilter,
        hasDateFilter,
        startDate,
        endDate,
        companyId: hasCompanyFilter ? userProfile.company_id : 'none'
      });

      console.log(`🚀 Executing count query for ${table}...`);
      const countResult = await countQuery;
      const { count: totalRecords, error: countError } = countResult;

      if (countError) {
        console.error('❌ Count query error for table:', table);
        console.error('❌ Error details:', JSON.stringify(countError, null, 2));
        console.error('❌ Error code:', countError.code);
        console.error('❌ Error message:', countError.message);
        console.error('❌ Query details:', {
          table,
          hasCompanyFilter,
          hasDateFilter,
          startDate,
          endDate,
          companyId: hasCompanyFilter ? userProfile.company_id : 'none'
        });
        console.error('❌ UserProfile:', userProfile);

        // Try a fallback strategy for building_orders
        if (table === "building_orders") {
          console.log('🔄 Trying fallback strategy for building_orders...');
          try {
            // Try without count, just get data and count manually
            let fallbackQuery = supabase.from(table).select("id");

            if (hasCompanyFilter) {
              fallbackQuery = fallbackQuery.eq("company_id", userProfile.company_id);
            }

            if (hasDateFilter && startDate && endDate) {
              fallbackQuery = fallbackQuery.gte("abertura", startDate).lte("abertura", endDate);
            }

            const { data: fallbackData, error: fallbackError } = await fallbackQuery;

            if (!fallbackError && fallbackData) {
              console.log(`✅ Fallback strategy worked, found ${fallbackData.length} records`);
              // Continue with manual count
              const manualCount = fallbackData.length;
              console.log(`📊 Manual count for ${table}: ${manualCount}`);

              if (manualCount === 0) {
                console.log(`No records found with fallback, returning empty array`);
                return [];
              }

              // Skip to data loading with manual count
              // Set totalRecords to manual count and continue
              const totalRecords = manualCount;

              // Continue with data query (we'll modify this below)
            } else {
              console.error('❌ Fallback strategy also failed:', fallbackError);
              throw countError;
            }
          } catch (fallbackErr) {
            console.error('❌ Fallback strategy exception:', fallbackErr);
            throw countError;
          }
        } else {
          throw countError;
        }
      }

      console.log(`Total records found for ${table} with filters: ${totalRecords}`);

      if (totalRecords === null || totalRecords === 0) {
        console.log(`No records found, returning empty array`);
        return [];
      }

      // 2. Criar query para buscar os dados com os mesmos filtros
      // Create a fresh query builder for data with identical filters
      let dataQuery = supabase.from(table).select("*").order("abertura", { ascending: false });

      if (hasCompanyFilter) {
        dataQuery = dataQuery.eq("company_id", userProfile.company_id);
        console.log(`Applied company filter to data query: ${userProfile.company_id}`);
      }

      if (hasDateFilter && startDate && endDate) {
        dataQuery = dataQuery.gte("abertura", startDate).lte("abertura", endDate);
        console.log(`Applied date filter to data query: ${startDate} to ${endDate}`);
      }

      console.log(`Data query prepared for ${table}, expecting ${totalRecords} records`);

      let allOrders: MaintenanceOrder[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      let iterations = 0;
      const maxIterations = Math.ceil(totalRecords / batchSize) + 10; // Margem de segurança
      const dataType = table === "maintenance_orders" ? "clínicos" : "prediais";

      while (hasMore && iterations < maxIterations) {
        iterations++;
        const { data: batch, error } = await dataQuery.range(
          from,
          from + batchSize - 1
        );

        if (error) {
          console.error('Batch query error:', error, {
            table,
            from,
            to: from + batchSize - 1,
            dateRange
          });
          throw error;
        }

        if (batch && batch.length > 0) {
          allOrders = allOrders.concat(batch);
          from += batchSize;

          // Verifica se chegou ao fim baseado no tamanho do batch OU se já temos todos os registros
          hasMore = batch.length === batchSize && allOrders.length < totalRecords;

          // 2. CALCULAR A PORCENTAGEM COM BASE NO TOTAL REAL
          let percentage = Math.round((allOrders.length / totalRecords) * 100);

          // 3. Garante que não ultrapasse 100%
          if (percentage > 100) percentage = 100;
          if (hasMore && percentage >= 99) {
            percentage = 99;
          }

          onProgress(
            `Carregando dados ${dataType}: ${allOrders.length.toLocaleString()} de ${totalRecords.toLocaleString()} registros...`,
            percentage
          );

          // Se já carregamos todos os registros esperados, para o loop
          if (allOrders.length >= totalRecords) {
            hasMore = false;
          }

          // Pequeno delay para não travar a UI em datasets muito grandes
          if (allOrders.length > 10000) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        } else {
          hasMore = false;
        }
      }

      if (iterations >= maxIterations) {
        console.warn(`Reached max iterations (${maxIterations}) for ${table}. Stopping to prevent infinite loop.`);
      }

      console.log(`Finished loading ${table}: ${allOrders.length} records in ${iterations} iterations`);

      // Verificação de sanidade: se a contagem estava errada, mostra warning
      if (allOrders.length !== totalRecords) {
        console.warn(`⚠️ Count mismatch for ${table}! Expected: ${totalRecords}, Got: ${allOrders.length}`);
        console.warn('Count query and data query filters may be inconsistent');
        console.warn('Filters applied:', {
          table,
          hasCompanyFilter,
          hasDateFilter,
          startDate,
          endDate,
          companyId: hasCompanyFilter ? userProfile.company_id : 'none'
        });

        // If the count is much larger than actual data, likely the count query didn't apply filters
        if (totalRecords > allOrders.length * 2) {
          console.error('🔍 DEBUGGING: Count query likely not applying filters correctly');
          console.error('Count query returned:', totalRecords);
          console.error('Data query returned:', allOrders.length);
        }
      }

      return allOrders;
    },
    [userProfile, isAdmin, fetchBuildingDataWithoutCount]
  );

  const loadClinicalData = useCallback(async (
    dateRange?: { start: Date; end: Date }
  ): Promise<MaintenanceOrder[]> => {
    // Define range padrão se não fornecido
    const effectiveDateRange = dateRange || {
      start: new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()),
      end: new Date()
    };

    console.log('🔄 loadClinicalData called with:', {
      providedDateRange: dateRange,
      effectiveDateRange: {
        start: effectiveDateRange.start.toISOString().split('T')[0],
        end: effectiveDateRange.end.toISOString().split('T')[0]
      },
      currentState: {
        clinicalLoaded: state.clinicalLoaded,
        clinicalLoading: state.clinicalLoading,
        dataLength: state.clinicalData.length,
        currentDateRange: state.dataDateRange ? {
          start: state.dataDateRange.start.toISOString().split('T')[0],
          end: state.dataDateRange.end.toISOString().split('T')[0]
        } : null
      }
    });

    // Check current state directly in setState callback to avoid stale closure
    let shouldProceed = true;
    let existingData: MaintenanceOrder[] = [];

    setState(currentState => {
      // Return cached data if already loaded with the same or broader date range
      if (
        currentState.clinicalLoaded &&
        !currentState.clinicalLoading &&
        currentState.clinicalData.length > 0 &&
        currentState.dataDateRange &&
        currentState.dataDateRange.start.getTime() <= effectiveDateRange.start.getTime() &&
        currentState.dataDateRange.end.getTime() >= effectiveDateRange.end.getTime()
      ) {
        console.log('Cache hit: Returning existing clinical data');
        shouldProceed = false;
        existingData = currentState.clinicalData;
      }

      // Prevent multiple concurrent loads
      if (currentState.clinicalLoading && shouldProceed) {
        console.log('Already loading clinical data, skipping');
        shouldProceed = false;
      }

      return currentState; // No state change
    });

    if (!shouldProceed) {
      return existingData;
    }

    try {
      updateState({
        clinicalLoading: true,
        clinicalError: null,
        loadingProgress: "Iniciando carregamento de dados clínicos...",
        loadingPercentage: 0,
      });

      const data = await fetchDataWithPagination(
        "maintenance_orders",
        (progress, percentage) => {
          updateState({
            loadingProgress: progress,
            loadingPercentage: percentage,
          });
        },
        effectiveDateRange
      );

      updateState({
        clinicalData: data,
        clinicalLoading: false,
        clinicalLoaded: true,
        clinicalError: null,
        dataDateRange: effectiveDateRange,
        loadingProgress: `Carregados ${data.length.toLocaleString()} registros clínicos com sucesso!`,
        loadingPercentage: 100,
      });

      // Clear progress message after 2 seconds
      setTimeout(() => {
        updateState({ loadingProgress: "", loadingPercentage: 0 });
      }, 2000);

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados clínicos";
      updateState({
        clinicalLoading: false,
        clinicalError: errorMessage,
        loadingProgress: "",
        loadingPercentage: 0,
      });
      throw error;
    }
  }, [
    fetchDataWithPagination,
    updateState,
  ]);

  const loadBuildingData = useCallback(async (
    dateRange?: { start: Date; end: Date }
  ): Promise<MaintenanceOrder[]> => {
    // Define range padrão se não fornecido
    const effectiveDateRange = dateRange || {
      start: new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()),
      end: new Date()
    };

    console.log('🏗️ loadBuildingData called with:', {
      providedDateRange: dateRange,
      effectiveDateRange: {
        start: effectiveDateRange.start.toISOString().split('T')[0],
        end: effectiveDateRange.end.toISOString().split('T')[0]
      },
      calledFrom: 'Component call',
      callStack: new Error().stack?.split('\n').slice(1, 3)
    });

    // Check current state directly in setState callback to avoid stale closure
    let shouldProceed = true;
    let existingData: MaintenanceOrder[] = [];

    setState(currentState => {
      // Return cached data if already loaded with the same or broader date range
      if (
        currentState.buildingLoaded &&
        !currentState.buildingLoading &&
        currentState.buildingData.length > 0 &&
        currentState.dataDateRange &&
        currentState.dataDateRange.start.getTime() <= effectiveDateRange.start.getTime() &&
        currentState.dataDateRange.end.getTime() >= effectiveDateRange.end.getTime()
      ) {
        console.log('Cache hit: Returning existing building data');
        shouldProceed = false;
        existingData = currentState.buildingData;
      }

      // Prevent multiple concurrent loads
      if (currentState.buildingLoading && shouldProceed) {
        console.log('Already loading building data, skipping');
        shouldProceed = false;
      }

      return currentState; // No state change
    });

    if (!shouldProceed) {
      return existingData;
    }

    try {
      updateState({
        buildingLoading: true,
        buildingError: null,
        loadingProgress: "Iniciando carregamento de dados prediais...",
        loadingPercentage: 0,
      });

      const data = await fetchDataWithPagination(
        "building_orders",
        (progress, percentage) => {
          updateState({
            loadingProgress: progress,
            loadingPercentage: percentage,
          });
        },
        effectiveDateRange
      );

      updateState({
        buildingData: data,
        buildingLoading: false,
        buildingLoaded: true,
        buildingError: null,
        dataDateRange: effectiveDateRange,
        loadingProgress: `Carregados ${data.length.toLocaleString()} registros prediais com sucesso!`,
        loadingPercentage: 100,
      });

      // Clear progress message after 2 seconds
      setTimeout(() => {
        updateState({ loadingProgress: "", loadingPercentage: 0 });
      }, 2000);

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar dados prediais";
      updateState({
        buildingLoading: false,
        buildingError: errorMessage,
        loadingProgress: "",
        loadingPercentage: 0,
      });
      throw error;
    }
  }, [
    fetchDataWithPagination,
    updateState,
  ]);

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
      loadingProgress: "",
      loadingPercentage: 0,
      dataDateRange: null,
    });
  }, []);

  const refreshData = useCallback(
    async (type: "clinical" | "building" | "both" = "both", dateRange?: { start: Date; end: Date }) => {
      if (type === "clinical" || type === "both") {
        updateState({
          clinicalLoaded: false,
          clinicalData: [],
          clinicalError: null,
          loadingPercentage: 0,
          dataDateRange: null,
        });
        await loadClinicalData(dateRange);
      }

      if (type === "building" || type === "both") {
        updateState({
          buildingLoaded: false,
          buildingData: [],
          buildingError: null,
          loadingPercentage: 0,
          dataDateRange: null,
        });
        await loadBuildingData(dateRange);
      }
    },
    [loadClinicalData, loadBuildingData, updateState]
  );

  const loadAdditionalData = useCallback(
    async (type: "clinical" | "building" | "both", dateRange: { start: Date; end: Date }) => {
      console.log('🔄 loadAdditionalData called:', {
        type,
        requestedRange: {
          start: dateRange.start.toISOString().split('T')[0],
          end: dateRange.end.toISOString().split('T')[0]
        },
        currentDataDateRange: state.dataDateRange ? {
          start: state.dataDateRange.start.toISOString().split('T')[0],
          end: state.dataDateRange.end.toISOString().split('T')[0]
        } : null
      });

      const requestedStart = dateRange.start;
      const requestedEnd = dateRange.end;

      // Check current state and determine action
      let shouldProceed = true;
      let currentDataDateRange: { start: Date; end: Date } | null = null;
      let currentClinicalData: MaintenanceOrder[] = [];
      let currentBuildingData: MaintenanceOrder[] = [];

      setState(currentState => {
        currentDataDateRange = currentState.dataDateRange;
        currentClinicalData = currentState.clinicalData;
        currentBuildingData = currentState.buildingData;

        if (!currentState.dataDateRange) {
          console.log('No existing data range, will need fresh load');
          return currentState;
        }

        // Calculate the new range that includes both existing and requested data
        const newStart = new Date(Math.min(currentState.dataDateRange.start.getTime(), requestedStart.getTime()));
        const newEnd = new Date(Math.max(currentState.dataDateRange.end.getTime(), requestedEnd.getTime()));

        // Check if we need to expand the date range
        const needsExpansion =
          newStart.getTime() < currentState.dataDateRange.start.getTime() ||
          newEnd.getTime() > currentState.dataDateRange.end.getTime();

        if (!needsExpansion) {
          console.log('Requested data is already loaded');
          shouldProceed = false;
        }

        return currentState;
      });

      if (!currentDataDateRange) {
        console.log('No existing data range, calling refreshData');
        return refreshData(type, dateRange);
      }

      if (!shouldProceed) {
        return;
      }

      // Calculate the new range that includes both existing and requested data
      const newStart = new Date(Math.min(currentDataDateRange.start.getTime(), requestedStart.getTime()));
      const newEnd = new Date(Math.max(currentDataDateRange.end.getTime(), requestedEnd.getTime()));

      console.log('Expanding data range:', {
        currentRange: {
          start: currentDataDateRange.start.toISOString().split('T')[0],
          end: currentDataDateRange.end.toISOString().split('T')[0]
        },
        newRange: {
          start: newStart.toISOString().split('T')[0],
          end: newEnd.toISOString().split('T')[0]
        }
      });

      if (type === "clinical" || type === "both") {
        try {
          updateState({
            clinicalLoading: true,
            clinicalError: null,
            loadingProgress: "Carregando dados clínicos adicionais...",
            loadingPercentage: 0,
          });

          const additionalData = await fetchDataWithPagination(
            "maintenance_orders",
            (progress, percentage) => {
              updateState({
                loadingProgress: progress,
                loadingPercentage: percentage,
              });
            },
            { start: newStart, end: newEnd }
          );

          // Merge with existing data and remove duplicates
          const mergedData = [...currentClinicalData, ...additionalData];
          const uniqueData = mergedData.filter((item, index, self) =>
            self.findIndex(t => t.id === item.id) === index
          );

          updateState({
            clinicalData: uniqueData,
            clinicalLoading: false,
            clinicalLoaded: true,
            clinicalError: null,
            dataDateRange: { start: newStart, end: newEnd },
            loadingProgress: `Carregados ${uniqueData.length.toLocaleString()} registros clínicos com sucesso!`,
            loadingPercentage: 100,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados clínicos adicionais";
          updateState({
            clinicalLoading: false,
            clinicalError: errorMessage,
            loadingProgress: "",
            loadingPercentage: 0,
          });
          throw error;
        }
      }

      if (type === "building" || type === "both") {
        try {
          updateState({
            buildingLoading: true,
            buildingError: null,
            loadingProgress: "Carregando dados prediais adicionais...",
            loadingPercentage: 0,
          });

          const additionalData = await fetchDataWithPagination(
            "building_orders",
            (progress, percentage) => {
              updateState({
                loadingProgress: progress,
                loadingPercentage: percentage,
              });
            },
            { start: newStart, end: newEnd }
          );

          // Merge with existing data and remove duplicates
          const mergedData = [...currentBuildingData, ...additionalData];
          const uniqueData = mergedData.filter((item, index, self) =>
            self.findIndex(t => t.id === item.id) === index
          );

          updateState({
            buildingData: uniqueData,
            buildingLoading: false,
            buildingLoaded: true,
            buildingError: null,
            dataDateRange: { start: newStart, end: newEnd },
            loadingProgress: `Carregados ${uniqueData.length.toLocaleString()} registros prediais com sucesso!`,
            loadingPercentage: 100,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados prediais adicionais";
          updateState({
            buildingLoading: false,
            buildingError: errorMessage,
            loadingProgress: "",
            loadingPercentage: 0,
          });
          throw error;
        }
      }

      // Clear progress message after 2 seconds
      setTimeout(() => {
        updateState({ loadingProgress: "", loadingPercentage: 0 });
      }, 2000);
    },
    [fetchDataWithPagination, updateState]
  );

  const contextValue: DataContextType = {
    ...state,
    loadClinicalData,
    loadBuildingData,
    clearCache,
    refreshData,
    loadAdditionalData,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
