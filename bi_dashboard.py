import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client, Client
import logging

# Configuração da página
st.set_page_config(
    page_title="Dashboard - Engenharia Clínica - GCINFRA",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS Personalizado Aprimorado
st.markdown("""
<style>
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #ff6b6b;
    }
    .kpi-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
    }
    .kpi-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
    }
    .filter-section {
        background-color: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border: 1px solid #e9ecef;
    }
    .filter-title {
        color: #495057;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
    }
    .filter-title:before {
        content: "🔍";
        margin-right: 8px;
    }
    .stSelectbox > div > div > div > div {
        background-color: white;
    }
    .stMultiSelect > div > div > div > div {
        background-color: white;
    }
    .sidebar-section {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border-left: 4px solid #007bff;
    }
</style>
""", unsafe_allow_html=True)

class MaintenanceDashboard:
    def __init__(self):
        # Configuração do Supabase
        try:
            self.SUPABASE_URL = st.secrets["SUPABASE_URL"]
            self.SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
            self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        except Exception as e:
            st.error(f"Falha ao conectar ao Supabase. Verifique seu arquivo .streamlit/secrets.toml. Erro: {e}")
            self.supabase = None

    @st.cache_data(ttl=300)  # Cache por 5 minutos
    def load_data(_self) -> pd.DataFrame:
        """
        Carrega TODOS os dados do Supabase usando paginação
        """
        try:
            if not _self.supabase:
                return pd.DataFrame()
            
            # Primeira consulta para contar o total de registros
            count_result = _self.supabase.table('maintenance_orders').select("*", count="exact").limit(1).execute()
            total_count = count_result.count if hasattr(count_result, 'count') else None
            
            if total_count:
                st.sidebar.info(f"📊 Total de registros no banco: {total_count:,}")
            
            # Configurações de paginação
            page_size = 1000  # Tamanho da página
            all_data = []
            offset = 0
            
            # Progress bar para mostrar o progresso do carregamento
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            while True:
                status_text.text(f"Carregando registros {offset + 1} a {offset + page_size}...")
                
                # Busca dados com paginação
                result = _self.supabase.table('maintenance_orders').select("*").range(offset, offset + page_size - 1).execute()
                
                if not result.data or len(result.data) == 0:
                    break
                
                all_data.extend(result.data)
                offset += page_size
                
                # Atualiza a barra de progresso
                if total_count:
                    progress = min(offset / total_count, 1.0)
                    progress_bar.progress(progress)
                
                # Se retornou menos dados que o page_size, chegamos ao fim
                if len(result.data) < page_size:
                    break
                
                # Proteção contra loop infinito
                if offset > 100000:  # Limite máximo de segurança
                    st.warning("Limite de segurança atingido. Carregamento interrompido.")
                    break
            
            # Remove a barra de progresso e status
            progress_bar.empty()
            status_text.empty()
            
            if all_data:
                df = pd.DataFrame(all_data)
                st.sidebar.success(f"✅ Carregados {len(df):,} registros com sucesso!")
                
                # Converte colunas de data
                date_columns = [
                    'abertura', 'parada', 'funcionamento', 'fechamento',
                    'data_atendimento', 'data_solucao', 'data_chamado',
                    'data_inicial_mo', 'data_fim_mo', 'inicio_pendencia', 'fechamento_pendencia'
                ]
                
                for col in date_columns:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                
                # Adiciona coluna "Possui Chamado" baseada na data_chamado
                if 'data_chamado' in df.columns:
                    df['possui_chamado'] = df['data_chamado'].apply(
                        lambda x: 'Sim' if pd.notna(x) else 'Não'
                    )
                
                return df
            else:
                return pd.DataFrame()
                
        except Exception as e:
            st.error(f"Erro ao carregar os dados: {e}")
            return pd.DataFrame()

    def load_data_alternative(_self) -> pd.DataFrame:
        """
        Método alternativo usando limit() para casos onde range() não funciona
        """
        try:
            if not _self.supabase:
                return pd.DataFrame()
            
            # Tenta carregar com um limite muito alto
            # Supabase permite até 1000 por padrão, mas pode ser configurado para mais
            result = _self.supabase.table('maintenance_orders').select("*").limit(10000).execute()
            
            if result.data:
                df = pd.DataFrame(result.data)
                st.sidebar.info(f"📊 Carregados {len(df):,} registros")
                
                # Se ainda está limitado a 1000, usa paginação manual
                if len(df) == 1000:
                    st.sidebar.warning("⚠️ Possível limitação de dados detectada. Usando paginação...")
                    return _self.load_data_with_pagination()
                
                # Converte colunas de data
                date_columns = [
                    'abertura', 'parada', 'funcionamento', 'fechamento',
                    'data_atendimento', 'data_solucao', 'data_chamado',
                    'data_inicial_mo', 'data_fim_mo', 'inicio_pendencia', 'fechamento_pendencia'
                ]
                
                for col in date_columns:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                
                # Adiciona coluna "Possui Chamado"
                if 'data_chamado' in df.columns:
                    df['possui_chamado'] = df['data_chamado'].apply(
                        lambda x: 'Sim' if pd.notna(x) else 'Não'
                    )
                
                return df
            else:
                return pd.DataFrame()
                
        except Exception as e:
            st.error(f"Erro ao carregar os dados: {e}")
            return pd.DataFrame()

    def load_data_with_pagination(_self) -> pd.DataFrame:
        """
        Método de paginação usando order by id e filtros
        """
        try:
            if not _self.supabase:
                return pd.DataFrame()
            
            all_data = []
            last_id = 0
            batch_size = 1000
            
            st.sidebar.info("🔄 Carregando dados em lotes...")
            
            while True:
                # Ordena por ID e pega o próximo lote
                result = _self.supabase.table('maintenance_orders').select("*").gt('id', last_id).order('id').limit(batch_size).execute()
                
                if not result.data or len(result.data) == 0:
                    break
                
                all_data.extend(result.data)
                last_id = result.data[-1]['id']  # Assume que existe uma coluna 'id'
                
                st.sidebar.text(f"Carregados {len(all_data):,} registros...")
                
                if len(result.data) < batch_size:
                    break
            
            if all_data:
                df = pd.DataFrame(all_data)
                
                # Converte colunas de data
                date_columns = [
                    'abertura', 'parada', 'funcionamento', 'fechamento',
                    'data_atendimento', 'data_solucao', 'data_chamado',
                    'data_inicial_mo', 'data_fim_mo', 'inicio_pendencia', 'fechamento_pendencia'
                ]
                
                for col in date_columns:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                
                # Adiciona coluna "Possui Chamado"
                if 'data_chamado' in df.columns:
                    df['possui_chamado'] = df['data_chamado'].apply(
                        lambda x: 'Sim' if pd.notna(x) else 'Não'
                    )
                
                return df
            else:
                return pd.DataFrame()
                
        except Exception as e:
            st.error(f"Erro na paginação: {e}")
            return pd.DataFrame()

    def create_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Cria todos os filtros na sidebar com design aprimorado
        """
        st.sidebar.markdown("""
        <div class="filter-title">Filtros do Dashboard</div>
        """, unsafe_allow_html=True)
        
        filtered_df = df.copy()
        
        # Container para organizar melhor os filtros
        with st.sidebar.container():
            # Filtro de Data
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**📅 Período**")
            if 'abertura' in df.columns and df['abertura'].notna().any():
                min_date = df['abertura'].min().date()
                max_date = df['abertura'].max().date()
                
                start_date, end_date = st.date_input(
                    "Selecione o período",
                    value=(min_date, max_date),
                    min_value=min_date,
                    max_value=max_date,
                    key="date_filter"
                )
                
                if len([start_date, end_date]) == 2:
                    mask = (filtered_df['abertura'].dt.date >= start_date) & (filtered_df['abertura'].dt.date <= end_date)
                    filtered_df = filtered_df[mask]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Empresa
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**🏢 Empresa**")
            if 'empresa' in df.columns:
                empresa_options = ['Todas'] + sorted([emp for emp in df['empresa'].unique() if pd.notna(emp) and emp != ''])
                selected_empresa = st.selectbox(
                    "Filtrar por empresa",
                    empresa_options,
                    key="empresa_filter"
                )
                
                if selected_empresa != 'Todas':
                    filtered_df = filtered_df[filtered_df['empresa'] == selected_empresa]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Equipamento
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**⚙️ Equipamento**")
            if 'equipamento' in filtered_df.columns:
                equipment_options = ['Todos'] + sorted([eq for eq in filtered_df['equipamento'].unique() if pd.notna(eq) and eq != ''])
                selected_equipment = st.selectbox(
                    "Filtrar por equipamento",
                    equipment_options,
                    key="equipment_filter"
                )
                
                if selected_equipment != 'Todos':
                    filtered_df = filtered_df[filtered_df['equipamento'] == selected_equipment]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Prioridade
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**🚨 Prioridade**")
            if 'prioridade' in df.columns:
                prioridade_options = ['Todas'] + sorted([p for p in df['prioridade'].unique() if pd.notna(p) and p != ''])
                selected_prioridades = st.multiselect(
                    "Filtrar por prioridade",
                    prioridade_options,
                    default=['Todas'],
                    key="prioridade_filter"
                )
                
                if 'Todas' not in selected_prioridades:
                    filtered_df = filtered_df[filtered_df['prioridade'].isin(selected_prioridades)]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Setor
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**🏗️ Setor**")
            if 'setor' in df.columns:
                setor_options = ['Todos'] + sorted([s for s in df['setor'].unique() if pd.notna(s) and s != ''])
                selected_setores = st.multiselect(
                    "Filtrar por setor",
                    setor_options,
                    default=['Todos'],
                    key="setor_filter"
                )
                
                if 'Todos' not in selected_setores:
                    filtered_df = filtered_df[filtered_df['setor'].isin(selected_setores)]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Tipo de Manutenção
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**🔧 Tipo de Manutenção**")
            if 'tipomanutencao' in df.columns:
                tipo_options = ['Todos'] + sorted([t for t in df['tipomanutencao'].unique() if pd.notna(t) and t != ''])
                selected_tipos = st.multiselect(
                    "Filtrar por tipo de manutenção",
                    tipo_options,
                    default=['Todos'],
                    key="tipo_filter"
                )
                
                if 'Todos' not in selected_tipos:
                    filtered_df = filtered_df[filtered_df['tipomanutencao'].isin(selected_tipos)]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Possui Chamado
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**📞 Possui Chamado**")
            if 'possui_chamado' in filtered_df.columns:
                chamado_options = ['Todos', 'Sim', 'Não']
                selected_chamado = st.selectbox(
                    "Filtrar por presença de chamado",
                    chamado_options,
                    key="chamado_filter"
                )
                
                if selected_chamado != 'Todos':
                    filtered_df = filtered_df[filtered_df['possui_chamado'] == selected_chamado]
            st.markdown('</div>', unsafe_allow_html=True)
            
            # Filtro de Status
            st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
            st.markdown("**📋 Status**")
            if 'situacao' in df.columns:
                status_options = ['Todos'] + sorted([status for status in df['situacao'].unique() if pd.notna(status) and status != ''])
                selected_status = st.multiselect(
                    "Filtrar por status",
                    status_options,
                    default=['Todos'],
                    key="status_filter"
                )
                
                if 'Todos' not in selected_status:
                    filtered_df = filtered_df[filtered_df['situacao'].isin(selected_status)]
            st.markdown('</div>', unsafe_allow_html=True)
        
        return filtered_df

    def show_filter_summary(self, original_df: pd.DataFrame, filtered_df: pd.DataFrame):
        """
        Mostra um resumo dos filtros aplicados
        """
        if len(filtered_df) != len(original_df):
            st.markdown(f"""
            <div style="background-color: #e3f2fd; padding: 1rem; border-radius: 8px; border-left: 4px solid #2196f3; margin: 1rem 0;">
                <strong>📊 Filtros Aplicados:</strong><br>
                Mostrando <strong>{len(filtered_df):,}</strong> registros de <strong>{len(original_df):,}</strong> totais
                ({(len(filtered_df)/len(original_df)*100):.1f}% dos dados)
            </div>
            """, unsafe_allow_html=True)

    def create_opening_heatmap(self, df: pd.DataFrame):
        """
        Cria um heatmap mostrando os dias da semana e horários de abertura das OS
        """
        st.subheader("🕐 Heatmap de Abertura de Ordens de Serviço")
        
        if df.empty or 'abertura' not in df.columns or df['abertura'].isna().all():
            st.warning("Não há dados de abertura disponíveis para o heatmap")
            return
        
        # Filtra apenas registros com data de abertura válida
        df_with_opening = df[df['abertura'].notna()].copy()
        
        if df_with_opening.empty:
            st.warning("Não há registros com data de abertura válida")
            return
        
        # Extrai informações de data e hora
        df_with_opening['weekday'] = df_with_opening['abertura'].dt.dayofweek
        df_with_opening['hour'] = df_with_opening['abertura'].dt.hour
        
        # Mapeia os dias da semana para português (0=Segunda, 6=Domingo)
        weekday_map = {
            0: 'Segunda-feira',
            1: 'Terça-feira', 
            2: 'Quarta-feira',
            3: 'Quinta-feira',
            4: 'Sexta-feira',
            5: 'Sábado',
            6: 'Domingo'
        }
        
        df_with_opening['weekday_pt'] = df_with_opening['weekday'].map(weekday_map)
        
        # Cria uma tabela pivot para o heatmap
        heatmap_data = df_with_opening.groupby(['weekday_pt', 'hour']).size().reset_index(name='count')
        
        # Cria uma matriz completa com todos os dias da semana e todas as horas
        all_weekdays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
        all_hours = list(range(24))
        
        # Cria um DataFrame completo com todas as combinações
        full_matrix = []
        for weekday in all_weekdays:
            for hour in all_hours:
                count = heatmap_data[
                    (heatmap_data['weekday_pt'] == weekday) & 
                    (heatmap_data['hour'] == hour)
                ]['count'].sum()
                full_matrix.append({
                    'weekday_pt': weekday,
                    'hour': hour,
                    'count': count
                })
        
        full_df = pd.DataFrame(full_matrix)
        
        # Transforma em matriz pivot
        pivot_df = full_df.pivot(index='weekday_pt', columns='hour', values='count').fillna(0)
        
        # Reorganiza as linhas para mostrar na ordem correta (segunda a domingo)
        pivot_df = pivot_df.reindex(all_weekdays)
        
        # Cria o heatmap usando plotly
        fig = go.Figure(data=go.Heatmap(
            z=pivot_df.values,
            x=[f"{h:02d}:00" for h in pivot_df.columns],
            y=pivot_df.index,
            colorscale='RdYlBu_r',
            showscale=True,
            hoverongaps=False,
            hovertemplate='<b>%{y}</b><br>' +
                         'Horário: %{x}<br>' +
                         'Ordens Abertas: %{z}<br>' +
                         '<extra></extra>'
        ))
        
        fig.update_layout(
            title={
                'text': 'Padrão de Abertura de Ordens de Serviço por Dia da Semana e Horário',
                'x': 0.5,
                'xanchor': 'center'
            },
            xaxis_title="Horário do Dia",
            yaxis_title="Dia da Semana",
            width=None,
            height=500,
            xaxis={
                'tickmode': 'array',
                'tickvals': list(range(0, 24, 2)),
                'ticktext': [f"{h:02d}:00" for h in range(0, 24, 2)]
            }
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Adiciona estatísticas complementares
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📊 Estatísticas por Dia da Semana")
            weekday_stats = df_with_opening.groupby('weekday_pt').size().sort_values(ascending=False)
            
            # Reorganiza para mostrar de segunda a domingo
            weekday_stats = weekday_stats.reindex(all_weekdays).fillna(0).astype(int)
            
            fig_weekday = px.bar(
                x=weekday_stats.index,
                y=weekday_stats.values,
                title="Ordens de Serviço por Dia da Semana",
                labels={'x': 'Dia da Semana', 'y': 'Quantidade de Ordens'}
            )
            fig_weekday.update_layout(xaxis_tickangle=45)
            st.plotly_chart(fig_weekday, use_container_width=True)
        
        with col2:
            st.subheader("⏰ Estatísticas por Horário")
            hour_stats = df_with_opening.groupby('hour').size().sort_values(ascending=False)
            
            fig_hour = px.bar(
                x=[f"{h:02d}:00" for h in hour_stats.index],
                y=hour_stats.values,
                title="Ordens de Serviço por Horário do Dia",
                labels={'x': 'Horário', 'y': 'Quantidade de Ordens'}
            )
            fig_hour.update_layout(xaxis_tickangle=45)
            st.plotly_chart(fig_hour, use_container_width=True)
        
        # Insights automáticos
        st.subheader("💡 Insights Automáticos")
        
        # Dia mais movimentado
        busiest_day = weekday_stats.idxmax()
        busiest_day_count = weekday_stats.max()
        
        # Horário mais movimentado
        busiest_hour = hour_stats.idxmax()
        busiest_hour_count = hour_stats.max()
        
        # Dia menos movimentado
        quietest_day = weekday_stats.idxmin()
        quietest_day_count = weekday_stats.min()
        
        # Horário menos movimentado (considerando horário comercial 6-22)
        business_hours = hour_stats[hour_stats.index.isin(range(6, 23))]
        quietest_business_hour = business_hours.idxmin() if not business_hours.empty else None
        
        insights = []
        
        insights.append(f"📈 **Dia mais movimentado:** {busiest_day} com {busiest_day_count} ordens abertas")
        insights.append(f"📉 **Dia menos movimentado:** {quietest_day} com {quietest_day_count} ordens abertas")
        insights.append(f"⏰ **Horário de pico:** {busiest_hour:02d}:00 com {busiest_hour_count} ordens abertas")
        
        if quietest_business_hour is not None:
            quietest_business_hour_count = business_hours.min()
            insights.append(f"🕐 **Horário comercial mais tranquilo:** {quietest_business_hour:02d}:00 com {quietest_business_hour_count} ordens abertas")
        
        # Percentual fim de semana vs dias úteis
        weekend_count = weekday_stats[['Sábado', 'Domingo']].sum()
        weekday_count = weekday_stats[['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']].sum()
        total_count = weekend_count + weekday_count
        
        if total_count > 0:
            weekend_pct = (weekend_count / total_count) * 100
            insights.append(f"📅 **Ordens em fins de semana:** {weekend_pct:.1f}% do total ({weekend_count} ordens)")
        
        # Horário comercial vs não comercial
        business_hours_count = hour_stats[hour_stats.index.isin(range(6, 19))].sum()  # 6h às 18h
        after_hours_count = hour_stats[~hour_stats.index.isin(range(6, 19))].sum()
        
        if total_count > 0:
            business_pct = (business_hours_count / total_count) * 100
            insights.append(f"🏢 **Ordens em horário comercial (6h-18h):** {business_pct:.1f}% do total ({business_hours_count} ordens)")
        
        for insight in insights:
            st.write(insight)

    def calculate_mtbf(self, df: pd.DataFrame, equipment_col: str = 'equipamento') -> pd.DataFrame:
        """
        Calcula o Tempo Médio Entre Falhas (MTBF) para cada equipamento
        """
        if df.empty:
            return pd.DataFrame()
        
        # Filtra por ordens de manutenção concluídas
        completed_orders = df[df['fechamento'].notna()].copy()
        
        if completed_orders.empty:
            return pd.DataFrame()
        
        # Agrupa por equipamento e calcula o MTBF
        mtbf_data = []
        
        for equipment in completed_orders[equipment_col].unique():
            if pd.isna(equipment) or equipment == '':
                continue
                
            eq_orders = completed_orders[completed_orders[equipment_col] == equipment].copy()
            eq_orders = eq_orders.sort_values('abertura')
            
            if len(eq_orders) < 2:
                continue
            
            # Calcula o tempo entre as falhas
            time_diffs = eq_orders['abertura'].diff().dt.total_seconds() / 3600  # Converte para horas
            mean_tbf = time_diffs.mean()
            
            if not pd.isna(mean_tbf):
                mtbf_data.append({
                    'equipamento': equipment,
                    'mtbf_hours': mean_tbf,
                    'failure_count': len(eq_orders),
                    'mtbf_days': mean_tbf / 24
                })
        
        return pd.DataFrame(mtbf_data)

    def calculate_mttr(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calcula o Tempo Médio Para Reparo (MTTR) para cada equipamento
        """
        if df.empty:
            return pd.DataFrame()
        
        # Filtra ordens com data de abertura e fechamento
        completed_orders = df[
            (df['abertura'].notna()) & 
            (df['fechamento'].notna())
        ].copy()
        
        if completed_orders.empty:
            return pd.DataFrame()
        
        # Calcula o tempo de reparo
        completed_orders['repair_time_hours'] = (
            completed_orders['fechamento'] - completed_orders['abertura']
        ).dt.total_seconds() / 3600
        
        # Agrupa por equipamento e calcula o MTTR
        mttr_data = completed_orders.groupby('equipamento').agg({
            'repair_time_hours': ['mean', 'count', 'std'],
            'os': 'count'
        }).round(2)
        
        mttr_data.columns = ['mttr_hours', 'repair_count', 'mttr_std', 'total_orders']
        mttr_data['mttr_days'] = (mttr_data['mttr_hours'] / 24).round(2)
        
        return mttr_data.reset_index()

    def calculate_availability(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calcula a disponibilidade do equipamento
        """
        if df.empty:
            return pd.DataFrame()
        
        # Filtra ordens concluídas
        completed_orders = df[
            (df['abertura'].notna()) & 
            (df['fechamento'].notna())
        ].copy()
        
        if completed_orders.empty:
            return pd.DataFrame()
        
        # Calcula o tempo de inatividade
        completed_orders['downtime_hours'] = (
            completed_orders['fechamento'] - completed_orders['abertura']
        ).dt.total_seconds() / 3600
        
        # Agrupa por equipamento
        availability_data = []
        
        for equipment in completed_orders['equipamento'].unique():
            if pd.isna(equipment) or equipment == '':
                continue
                
            eq_orders = completed_orders[completed_orders['equipamento'] == equipment]
            
            # Calcula o tempo total de inatividade
            total_downtime = eq_orders['downtime_hours'].sum()
            
            # Assume operação 24/7 para o cálculo da disponibilidade
            # Você pode ajustar isso com base nas horas de operação reais
            date_range = (eq_orders['fechamento'].max() - eq_orders['abertura'].min()).total_seconds() / 3600
            
            if date_range > 0:
                availability_pct = max(0, (date_range - total_downtime) / date_range * 100)
                
                availability_data.append({
                    'equipamento': equipment,
                    'total_downtime_hours': total_downtime,
                    'availability_pct': availability_pct,
                    'failure_count': len(eq_orders)
                })
        
        return pd.DataFrame(availability_data)

    def create_kpi_metrics(self, df: pd.DataFrame):
        """
        Cria e exibe as métricas de KPI
        """
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_os = len(df)
            st.metric("Total de Ordens de Serviço", f"{total_os:,}")
        
        with col2:
            open_os = len(df[df['situacao'].isin(['Aberto', 'Em Andamento', 'Pendente'])])
            st.metric("Ordens em Aberto", f"{open_os:,}")
        
        with col3:
            if not df.empty:
                avg_resolution_time = df[
                    (df['abertura'].notna()) & (df['fechamento'].notna())
                ]['fechamento'].subtract(df['abertura']).dt.total_seconds() / 3600
                avg_hours = avg_resolution_time.mean()
                if not pd.isna(avg_hours):
                    st.metric("Tempo Médio de Resolução", f"{avg_hours:.1f}h")
                else:
                    st.metric("Tempo Médio de Resolução", "N/D")
            else:
                st.metric("Tempo Médio de Resolução", "N/D")
        
        with col4:
            total_cost = df[['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno']].sum().sum()
            st.metric("Custo Total de Manutenção", f"R$ {total_cost:,.2f}")

    def create_charts(self, df: pd.DataFrame):
        """
        Cria vários gráficos para o dashboard
        """
        if df.empty:
            st.warning("Não há dados disponíveis para os gráficos")
            return
        
        # Linha 1: Série temporal e distribuição de status
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Ordens de Serviço ao Longo do Tempo")
            if 'abertura' in df.columns and df['abertura'].notna().any():
                df_time = df[df['abertura'].notna()].copy()
                df_time['month'] = df_time['abertura'].dt.to_period('M')
                monthly_orders = df_time.groupby('month').size().reset_index(name='count')
                monthly_orders['month'] = monthly_orders['month'].astype(str)
                
                fig = px.line(monthly_orders, x='month', y='count', 
                              title="Tendência Mensal de Ordens de Serviço")
                fig.update_layout(xaxis_tickangle=45)
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Não há dados de data disponíveis")
        
        with col2:
            st.subheader("Distribuição de Status das Ordens de Serviço")
            if 'situacao' in df.columns:
                status_counts = df['situacao'].value_counts()
                fig = px.pie(values=status_counts.values, names=status_counts.index,
                             title="Distribuição de Status")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Não há dados de status disponíveis")
        
        # Linha 2: Análise de equipamentos
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Principais Equipamentos por Contagem de Falhas")
            if 'equipamento' in df.columns:
                equipment_counts = df['equipamento'].value_counts().head(10)
                fig = px.bar(x=equipment_counts.values, y=equipment_counts.index,
                             orientation='h', title="Equipamentos Mais Problemáticos")
                fig.update_layout(yaxis={'categoryorder': 'total ascending'})
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Não há dados de equipamento disponíveis")
        
        with col2:
            st.subheader("Distribuição por Tipo de Manutenção")
            if 'tipomanutencao' in df.columns:
                maintenance_counts = df['tipomanutencao'].value_counts()
                fig = px.bar(x=maintenance_counts.index, y=maintenance_counts.values,
                             title="Tipos de Manutenção")
                fig.update_layout(xaxis_tickangle=45)
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Não há dados de tipo de manutenção disponíveis")
        
        # Linha 3: Análise de custos
        st.subheader("Análise de Custos")
        cost_cols = ['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno']
        available_cost_cols = [col for col in cost_cols if col in df.columns]
        
        if available_cost_cols:
            cost_data = df[available_cost_cols].sum()
            fig = px.bar(x=cost_data.index, y=cost_data.values,
                         title="Custos Totais por Categoria")
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("Não há dados de custo disponíveis")
        
        # NOVO: Adiciona o heatmap de abertura das OS
        st.markdown("---")
        self.create_opening_heatmap(df)

    def create_mtbf_mttr_analysis(self, df: pd.DataFrame):
        """
        Cria a seção de análise de MTBF e MTTR
        """
        st.header("🔧 Análise de Confiabilidade (MTBF & MTTR)")
        
        if df.empty:
            st.warning("Não há dados disponíveis para a análise de confiabilidade")
            return
        
        # Calcula MTBF e MTTR
        with st.spinner("Calculando métricas de confiabilidade..."):
            mtbf_df = self.calculate_mtbf(df)
            mttr_df = self.calculate_mttr(df)
            availability_df = self.calculate_availability(df)
        
        # Cria abas para diferentes análises
        tab1, tab2, tab3 = st.tabs(["Análise de MTBF", "Análise de MTTR", "Análise de Disponibilidade"])
        
        with tab1:
            st.subheader("Tempo Médio Entre Falhas (MTBF)")
            if not mtbf_df.empty:
                col1, col2 = st.columns(2)
                
                with col1:
                    # Top 10 equipamentos por MTBF
                    top_mtbf = mtbf_df.nlargest(10, 'mtbf_days')
                    fig = px.bar(top_mtbf, x='mtbf_days', y='equipamento',
                                 orientation='h', title="Top 10 Equipamentos por MTBF (Dias)")
                    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    # Piores 10 equipamentos por MTBF (mais problemáticos)
                    bottom_mtbf = mtbf_df.nsmallest(10, 'mtbf_days')
                    fig = px.bar(bottom_mtbf, x='mtbf_days', y='equipamento',
                                 orientation='h', title="Piores 10 Equipamentos por MTBF (Dias)",
                                 color_discrete_sequence=['red'])
                    fig.update_layout(yaxis={'categoryorder': 'total descending'})
                    st.plotly_chart(fig, use_container_width=True)
                
                # Tabela de resumo do MTBF
                st.subheader("Resumo do MTBF")
                st.dataframe(mtbf_df.round(2), use_container_width=True)
            else:
                st.info("Dados insuficientes para o cálculo do MTBF")
        
        with tab2:
            st.subheader("Tempo Médio Para Reparo (MTTR)")
            if not mttr_df.empty:
                col1, col2 = st.columns(2)
                
                with col1:
                    # Melhor MTTR (reparos mais rápidos)
                    best_mttr = mttr_df.nsmallest(10, 'mttr_hours')
                    fig = px.bar(best_mttr, x='mttr_hours', y='equipamento',
                                 orientation='h', title="Reparos Mais Rápidos (MTTR em Horas)",
                                 color_discrete_sequence=['green'])
                    fig.update_layout(yaxis={'categoryorder': 'total ascending'})
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    # Pior MTTR (reparos mais lentos)
                    worst_mttr = mttr_df.nlargest(10, 'mttr_hours')
                    fig = px.bar(worst_mttr, x='mttr_hours', y='equipamento',
                                 orientation='h', title="Reparos Mais Lentos (MTTR em Horas)",
                                 color_discrete_sequence=['red'])
                    fig.update_layout(yaxis={'categoryorder': 'total descending'})
                    st.plotly_chart(fig, use_container_width=True)
                
                # Tabela de resumo do MTTR
                st.subheader("Resumo do MTTR")
                st.dataframe(mttr_df.round(2), use_container_width=True)
            else:
                st.info("Dados insuficientes para o cálculo do MTTR")
        
        with tab3:
            st.subheader("Disponibilidade dos Equipamentos")
            if not availability_df.empty:
                # Gráfico de disponibilidade
                fig = px.bar(availability_df.nlargest(15, 'availability_pct'), 
                             x='equipamento', y='availability_pct',
                             title="Disponibilidade dos Equipamentos (%)")
                fig.update_layout(xaxis_tickangle=45)
                fig.add_hline(y=90, line_dash="dash", line_color="green", 
                              annotation_text="Meta de 90%")
                st.plotly_chart(fig, use_container_width=True)
                
                # Resumo da disponibilidade
                avg_availability = availability_df['availability_pct'].mean()
                st.metric("Disponibilidade Média dos Equipamentos", f"{avg_availability:.1f}%")
                
                # Tabela de disponibilidade
                st.subheader("Resumo da Disponibilidade")
                st.dataframe(availability_df.round(2), use_container_width=True)
            else:
                st.info("Dados insuficientes para o cálculo da disponibilidade")


def main():
    """
    Função principal para rodar o dashboard
    """
    st.title("🔧 Dashboard Engenharia Clínica - GCINFRA")
    st.markdown("---")
    
    # Inicializa o dashboard
    dashboard = MaintenanceDashboard()
    
    # Controles da barra lateral
    st.sidebar.header("⚙️ Controles do Dashboard")
    
    # Botão de atualização de dados
    if st.sidebar.button("🔄 Atualizar Dados", help="Clique para recarregar os dados do banco"):
        st.cache_data.clear()
        st.rerun()
    
    # Opção para escolher método de carregamento
    st.sidebar.markdown("---")
    st.sidebar.subheader("🔧 Opções de Carregamento")
    
    load_method = st.sidebar.radio(
        "Escolha o método de carregamento:",
        ["Automático (Recomendado)", "Paginação Manual", "Limite Alto"],
        help="""
        - Automático: Usa paginação inteligente
        - Paginação Manual: Carrega por ID sequencial
        - Limite Alto: Tenta carregar tudo de uma vez
        """
    )
    
    # Carrega os dados baseado no método escolhido
    with st.spinner("Carregando dados..."):
        if load_method == "Automático (Recomendado)":
            original_df = dashboard.load_data()
        elif load_method == "Paginação Manual":
            original_df = dashboard.load_data_with_pagination()
        else:  # Limite Alto
            original_df = dashboard.load_data_alternative()
    
    if original_df.empty:
        st.error("Nenhum dado disponível. Por favor, verifique sua conexão com o Supabase e garanta que os dados foram carregados.")
        st.info("Certifique-se de executar o script de extração de dados primeiro para popular seu banco de dados.")
        
        # Informações de debug
        with st.expander("🔍 Informações de Debug"):
            st.write("**Possíveis soluções:**")
            st.write("1. Verifique se o arquivo `.streamlit/secrets.toml` está configurado corretamente")
            st.write("2. Confirme se a tabela 'maintenance_orders' existe no Supabase")
            st.write("3. Verifique as permissões de acesso à tabela")
            st.write("4. Tente diferentes métodos de carregamento na barra lateral")
            
            if dashboard.supabase:
                st.success("✅ Conexão com Supabase estabelecida")
                
                # Testa conexão básica
                try:
                    test_result = dashboard.supabase.table('maintenance_orders').select("count", count="exact").limit(1).execute()
                    if hasattr(test_result, 'count'):
                        st.info(f"📊 Total de registros detectados: {test_result.count}")
                    else:
                        st.warning("⚠️ Não foi possível contar os registros")
                except Exception as e:
                    st.error(f"❌ Erro ao acessar a tabela: {e}")
            else:
                st.error("❌ Falha na conexão com Supabase")
        
        return
    
    # Aplica os filtros
    filtered_df = dashboard.create_filters(original_df)
    
    # Mostra resumo dos filtros aplicados
    dashboard.show_filter_summary(original_df, filtered_df)
    
    # Informações dos dados na sidebar
    st.sidebar.markdown("---")
    st.sidebar.info(f"📊 **Dados carregados:** {len(original_df):,} registros")
    st.sidebar.success(f"📋 **Dados filtrados:** {len(filtered_df):,} registros")
    
    if 'abertura' in filtered_df.columns and filtered_df['abertura'].notna().any():
        date_range = f"{filtered_df['abertura'].min().strftime('%Y-%m-%d')} a {filtered_df['abertura'].max().strftime('%Y-%m-%d')}"
        st.sidebar.info(f"📅 **Período:** {date_range}")
    
    # Informações adicionais sobre os dados
    st.sidebar.markdown("---")
    st.sidebar.subheader("📈 Estatísticas dos Dados")
    
    if not filtered_df.empty:
        # Estatísticas básicas
        if 'situacao' in filtered_df.columns:
            status_counts = filtered_df['situacao'].value_counts()
            st.sidebar.write("**Status mais comum:**")
            st.sidebar.write(f"- {status_counts.index[0]}: {status_counts.iloc[0]:,} registros")
        
        if 'equipamento' in filtered_df.columns:
            eq_count = filtered_df['equipamento'].nunique()
            st.sidebar.write(f"**Equipamentos únicos:** {eq_count:,}")
        
        if 'empresa' in filtered_df.columns:
            emp_count = filtered_df['empresa'].nunique()
            st.sidebar.write(f"**Empresas únicas:** {emp_count:,}")
    
    # Exibe métricas de KPI
    st.header("📊 Indicadores Chave de Performance (KPIs)")
    dashboard.create_kpi_metrics(filtered_df)
    st.markdown("---")
    
    # Exibe gráficos principais (que agora incluem o heatmap)
    st.header("📈 Gráficos de Análise")
    dashboard.create_charts(filtered_df)
    st.markdown("---")
    
    # Exibe análise de confiabilidade
    dashboard.create_mtbf_mttr_analysis(filtered_df)
    
    # Seção de dados brutos (opcional)
    st.markdown("---")
    if st.expander("📋 Ver Dados Brutos"):
        st.subheader("Dados Filtrados")
        st.dataframe(filtered_df, use_container_width=True)
        
        # Botão de download
        csv = filtered_df.to_csv(index=False)
        st.download_button(
            label="📥 Baixar Dados Filtrados (CSV)",
            data=csv,
            file_name=f'maintenance_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
            mime='text/csv'
        )


if __name__ == "__main__":
    main()