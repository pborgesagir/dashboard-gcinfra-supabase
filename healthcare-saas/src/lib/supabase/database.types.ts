export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'manager'
export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          company_id: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          role?: UserRole
          company_id?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          company_id?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      user_invitations: {
        Row: {
          id: string
          email: string
          role: UserRole
          company_id: string | null
          invited_by: string | null
          token: string
          status: InviteStatus
          expires_at: string
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          role?: UserRole
          company_id?: string | null
          invited_by?: string | null
          token: string
          status?: InviteStatus
          expires_at: string
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          company_id?: string | null
          invited_by?: string | null
          token?: string
          status?: InviteStatus
          expires_at?: string
          created_at?: string
          accepted_at?: string | null
        }
      }
      maintenance_orders: {
        Row: {
          id?: number
          empresa: string | null
          razaosocial: string | null
          grupo_setor: string | null
          os: string | null
          oficina: string | null
          tipo: string | null
          prioridade: string | null
          complexidade: string | null
          tag: string | null
          patrimonio: string | null
          sn: string | null
          equipamento: string | null
          setor: string | null
          abertura: string | null
          parada: string | null
          funcionamento: string | null
          fechamento: string | null
          data_atendimento: string | null
          data_solucao: string | null
          data_chamado: string | null
          ocorrencia: string | null
          causa: string | null
          fornecedor: string | null
          custo_os: number | null
          custo_mo: number | null
          custo_peca: number | null
          custo_servicoexterno: number | null
          responsavel: string | null
          solicitante: string | null
          tipomanutencao: string | null
          situacao: string | null
          colaborador_mo: string | null
          data_inicial_mo: string | null
          data_fim_mo: string | null
          qtd_mo_min: number | null
          obs_mo: string | null
          servico: string | null
          requisicao: string | null
          avaliacao: string | null
          obs_requisicao: string | null
          pendencia: string | null
          inicio_pendencia: string | null
          fechamento_pendencia: string | null
          familia: string | null
          modelo: string | null
          tipoequipamento: string | null
          fabricante: string | null
          nserie: string | null
          tombamento: string | null
          cadastro: string | null
          instalacao: string | null
          garantia: string | null
          verificacao: string | null
          company_id: string | null
        }
        Insert: {
          id?: number
          empresa?: string | null
          razaosocial?: string | null
          grupo_setor?: string | null
          os?: string | null
          oficina?: string | null
          tipo?: string | null
          prioridade?: string | null
          complexidade?: string | null
          tag?: string | null
          patrimonio?: string | null
          sn?: string | null
          equipamento?: string | null
          setor?: string | null
          abertura?: string | null
          parada?: string | null
          funcionamento?: string | null
          fechamento?: string | null
          data_atendimento?: string | null
          data_solucao?: string | null
          data_chamado?: string | null
          ocorrencia?: string | null
          causa?: string | null
          fornecedor?: string | null
          custo_os?: number | null
          custo_mo?: number | null
          custo_peca?: number | null
          custo_servicoexterno?: number | null
          responsavel?: string | null
          solicitante?: string | null
          tipomanutencao?: string | null
          situacao?: string | null
          colaborador_mo?: string | null
          data_inicial_mo?: string | null
          data_fim_mo?: string | null
          qtd_mo_min?: number | null
          obs_mo?: string | null
          servico?: string | null
          requisicao?: string | null
          avaliacao?: string | null
          obs_requisicao?: string | null
          pendencia?: string | null
          inicio_pendencia?: string | null
          fechamento_pendencia?: string | null
          familia?: string | null
          modelo?: string | null
          tipoequipamento?: string | null
          fabricante?: string | null
          nserie?: string | null
          tombamento?: string | null
          cadastro?: string | null
          instalacao?: string | null
          garantia?: string | null
          verificacao?: string | null
          company_id?: string | null
        }
        Update: {
          id?: number
          empresa?: string | null
          razaosocial?: string | null
          grupo_setor?: string | null
          os?: string | null
          oficina?: string | null
          tipo?: string | null
          prioridade?: string | null
          complexidade?: string | null
          tag?: string | null
          patrimonio?: string | null
          sn?: string | null
          equipamento?: string | null
          setor?: string | null
          abertura?: string | null
          parada?: string | null
          funcionamento?: string | null
          fechamento?: string | null
          data_atendimento?: string | null
          data_solucao?: string | null
          data_chamado?: string | null
          ocorrencia?: string | null
          causa?: string | null
          fornecedor?: string | null
          custo_os?: number | null
          custo_mo?: number | null
          custo_peca?: number | null
          custo_servicoexterno?: number | null
          responsavel?: string | null
          solicitante?: string | null
          tipomanutencao?: string | null
          situacao?: string | null
          colaborador_mo?: string | null
          data_inicial_mo?: string | null
          data_fim_mo?: string | null
          qtd_mo_min?: number | null
          obs_mo?: string | null
          servico?: string | null
          requisicao?: string | null
          avaliacao?: string | null
          obs_requisicao?: string | null
          pendencia?: string | null
          inicio_pendencia?: string | null
          fechamento_pendencia?: string | null
          familia?: string | null
          modelo?: string | null
          tipoequipamento?: string | null
          fabricante?: string | null
          nserie?: string | null
          tombamento?: string | null
          cadastro?: string | null
          instalacao?: string | null
          garantia?: string | null
          verificacao?: string | null
          company_id?: string | null
        }
      }
      building_orders: {
        Row: {
          id?: number
          empresa_id: number | null
          empresa: string | null
          razaosocial: string | null
          grupo_setor: string | null
          os: string | null
          oficina: string | null
          tipo: string | null
          prioridade: string | null
          complexidade: string | null
          tag: string | null
          patrimonio: string | null
          sn: string | null
          equipamento: string | null
          setor: string | null
          abertura: string | null
          parada: string | null
          funcionamento: string | null
          fechamento: string | null
          data_atendimento: string | null
          data_solucao: string | null
          data_chamado: string | null
          ocorrencia: string | null
          causa: string | null
          fornecedor: string | null
          custo_os: number | null
          custo_mo: number | null
          custo_peca: number | null
          custo_servicoexterno: number | null
          responsavel: string | null
          solicitante: string | null
          tipomanutencao: string | null
          situacao: string | null
          situacao_int: number | null
          colaborador_mo: string | null
          data_inicial_mo: string | null
          data_fim_mo: string | null
          qtd_mo_min: number | null
          obs_mo: string | null
          servico: string | null
          requisicao: string | null
          avaliacao: string | null
          obs_requisicao: string | null
          pendencia: string | null
          inicio_pendencia: string | null
          fechamento_pendencia: string | null
          company_id: string | null
        }
        Insert: {
          id?: number
          empresa_id?: number | null
          empresa?: string | null
          razaosocial?: string | null
          grupo_setor?: string | null
          os?: string | null
          oficina?: string | null
          tipo?: string | null
          prioridade?: string | null
          complexidade?: string | null
          tag?: string | null
          patrimonio?: string | null
          sn?: string | null
          equipamento?: string | null
          setor?: string | null
          abertura?: string | null
          parada?: string | null
          funcionamento?: string | null
          fechamento?: string | null
          data_atendimento?: string | null
          data_solucao?: string | null
          data_chamado?: string | null
          ocorrencia?: string | null
          causa?: string | null
          fornecedor?: string | null
          custo_os?: number | null
          custo_mo?: number | null
          custo_peca?: number | null
          custo_servicoexterno?: number | null
          responsavel?: string | null
          solicitante?: string | null
          tipomanutencao?: string | null
          situacao?: string | null
          situacao_int?: number | null
          colaborador_mo?: string | null
          data_inicial_mo?: string | null
          data_fim_mo?: string | null
          qtd_mo_min?: number | null
          obs_mo?: string | null
          servico?: string | null
          requisicao?: string | null
          avaliacao?: string | null
          obs_requisicao?: string | null
          pendencia?: string | null
          inicio_pendencia?: string | null
          fechamento_pendencia?: string | null
          company_id?: string | null
        }
        Update: {
          id?: number
          empresa_id?: number | null
          empresa?: string | null
          razaosocial?: string | null
          grupo_setor?: string | null
          os?: string | null
          oficina?: string | null
          tipo?: string | null
          prioridade?: string | null
          complexidade?: string | null
          tag?: string | null
          patrimonio?: string | null
          sn?: string | null
          equipamento?: string | null
          setor?: string | null
          abertura?: string | null
          parada?: string | null
          funcionamento?: string | null
          fechamento?: string | null
          data_atendimento?: string | null
          data_solucao?: string | null
          data_chamado?: string | null
          ocorrencia?: string | null
          causa?: string | null
          fornecedor?: string | null
          custo_os?: number | null
          custo_mo?: number | null
          custo_peca?: number | null
          custo_servicoexterno?: number | null
          responsavel?: string | null
          solicitante?: string | null
          tipomanutencao?: string | null
          situacao?: string | null
          situacao_int?: number | null
          colaborador_mo?: string | null
          data_inicial_mo?: string | null
          data_fim_mo?: string | null
          qtd_mo_min?: number | null
          obs_mo?: string | null
          servico?: string | null
          requisicao?: string | null
          avaliacao?: string | null
          obs_requisicao?: string | null
          pendencia?: string | null
          inicio_pendencia?: string | null
          fechamento_pendencia?: string | null
          company_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      invite_status: InviteStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}