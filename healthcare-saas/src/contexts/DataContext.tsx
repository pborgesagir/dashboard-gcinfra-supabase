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
}

interface DataContextType extends DataState {
  loadClinicalData: () => Promise<MaintenanceOrder[]>;
  loadBuildingData: () => Promise<MaintenanceOrder[]>;
  clearCache: () => void;
  refreshData: (type?: "clinical" | "building" | "both") => Promise<void>;
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
  });

  const updateState = useCallback((updates: Partial<DataState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const fetchDataWithPagination = useCallback(
    async (
      table: "maintenance_orders" | "building_orders",
      onProgress: (progress: string, percentage: number) => void
    ): Promise<MaintenanceOrder[]> => {
      // Cria uma query base que será usada tanto para contagem quanto para busca
      let baseQuery = supabase.from(table);

      // Aplica o filtro de empresa para usuários não administradores
      if (!isAdmin && userProfile?.company_id) {
        baseQuery = baseQuery.eq("company_id", userProfile.company_id);
      }

      // 1. OBTER A CONTAGEM TOTAL DE REGISTROS PRIMEIRO
      // Esta consulta é rápida pois usa `head: true` para não trazer os dados, apenas o total.
      const { count: totalRecords, error: countError } = await baseQuery.select(
        "*",
        { count: "exact", head: true }
      );

      if (countError) throw countError;
      if (totalRecords === null || totalRecords === 0) return []; // Retorna vazio se não houver dados

      // A partir daqui, a query principal continua para buscar os dados
      let query = baseQuery.select("*").order("abertura", { ascending: false });

      let allOrders: MaintenanceOrder[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      const dataType = table === "maintenance_orders" ? "clínicos" : "prediais";

      while (hasMore) {
        const { data: batch, error } = await query.range(
          from,
          from + batchSize - 1
        );

        if (error) throw error;

        if (batch && batch.length > 0) {
          allOrders = allOrders.concat(batch);
          from += batchSize;
          hasMore = batch.length === batchSize;

          // 2. CALCULAR A PORCENTAGEM COM BASE NO TOTAL REAL
          // A lógica de estimativa foi removida e substituída por este cálculo preciso.
          let percentage = Math.round((allOrders.length / totalRecords) * 100);

          // 3. (OPCIONAL) LIMITAR A 99% ATÉ A CONCLUSÃO FINAL
          // Garante que a barra não atinja 100% antes de ter todos os dados.
          if (hasMore && percentage >= 99) {
            percentage = 99;
          }

          onProgress(
            `Carregando dados ${dataType}: ${allOrders.length.toLocaleString()} de ${totalRecords.toLocaleString()} registros...`,
            percentage
          );

          // Pequeno delay para não travar a UI em datasets muito grandes
          if (allOrders.length > 10000) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        } else {
          hasMore = false;
        }
      }

      return allOrders;
    },
    [userProfile, isAdmin]
  );

  const loadClinicalData = useCallback(async (): Promise<
    MaintenanceOrder[]
  > => {
    // Return cached data if already loaded
    if (
      state.clinicalLoaded &&
      !state.clinicalLoading &&
      state.clinicalData.length > 0
    ) {
      return state.clinicalData;
    }

    // Prevent multiple concurrent loads
    if (state.clinicalLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!state.clinicalLoading) {
            resolve(state.clinicalData);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
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
        }
      );

      updateState({
        clinicalData: data,
        clinicalLoading: false,
        clinicalLoaded: true,
        clinicalError: null,
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
    state.clinicalLoaded,
    state.clinicalLoading,
    state.clinicalData,
    fetchDataWithPagination,
    updateState,
  ]);

  const loadBuildingData = useCallback(async (): Promise<
    MaintenanceOrder[]
  > => {
    // Return cached data if already loaded
    if (
      state.buildingLoaded &&
      !state.buildingLoading &&
      state.buildingData.length > 0
    ) {
      return state.buildingData;
    }

    // Prevent multiple concurrent loads
    if (state.buildingLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!state.buildingLoading) {
            resolve(state.buildingData);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
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
        }
      );

      updateState({
        buildingData: data,
        buildingLoading: false,
        buildingLoaded: true,
        buildingError: null,
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
    state.buildingLoaded,
    state.buildingLoading,
    state.buildingData,
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
    });
  }, []);

  const refreshData = useCallback(
    async (type: "clinical" | "building" | "both" = "both") => {
      if (type === "clinical" || type === "both") {
        updateState({
          clinicalLoaded: false,
          clinicalData: [],
          clinicalError: null,
          loadingPercentage: 0,
        });
        await loadClinicalData();
      }

      if (type === "building" || type === "both") {
        updateState({
          buildingLoaded: false,
          buildingData: [],
          buildingError: null,
          loadingPercentage: 0,
        });
        await loadBuildingData();
      }
    },
    [loadClinicalData, loadBuildingData, updateState]
  );

  const contextValue: DataContextType = {
    ...state,
    loadClinicalData,
    loadBuildingData,
    clearCache,
    refreshData,
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
