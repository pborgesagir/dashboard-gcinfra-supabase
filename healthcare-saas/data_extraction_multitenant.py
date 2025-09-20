import requests
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json
import logging
from typing import Dict, List, Optional
import time
import numpy as np

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MultiTenantMaintenanceDataExtractor:
    def __init__(self):
        # Configuration
        self.API_CONFIG = {
            'token': os.getenv("API_TOKEN"),
            'user': os.getenv("API_USER"),
            'base_url_os': "https://sesgo.api.neovero.com/api/queries/execute/consulta_os",
            'base_url_equipamento': "https://sesgo.api.neovero.com/api/queries/execute/consulta_equipamento",
            'api_key_header': "X-API-KEY"
        }

        # Supabase configuration
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY")

        # Initialize Supabase client with service role key for bypassing RLS
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        self.columns = [
            'empresa', 'razaosocial', 'grupo_setor', 'os', 'oficina', 'tipo', 'prioridade',
            'complexidade', 'tag', 'patrimonio', 'sn', 'equipamento', 'setor', 'abertura',
            'parada', 'funcionamento', 'fechamento', 'data_atendimento', 'data_solucao',
            'data_chamado', 'ocorrencia', 'causa', 'fornecedor', 'custo_os', 'custo_mo',
            'custo_peca', 'custo_servicoexterno', 'responsavel', 'solicitante',
            'tipomanutencao', 'situacao', 'colaborador_mo', 'data_inicial_mo',
            'data_fim_mo', 'qtd_mo_min', 'obs_mo', 'servico', 'requisicao', 'avaliacao',
            'obs_requisicao', 'pendencia', 'inicio_pendencia', 'fechamento_pendencia',
            'familia', 'modelo', 'tipoequipamento', 'fabricante', 'nserie', 
            'tombamento', 'cadastro', 'instalacao', 'garantia', 'verificacao',
            'company_id'
        ]

        # Dictionaries for case-insensitive mapping
        self.company_name_mapping = {}
        self.company_acronym_mapping = {}
        self.load_company_mapping()

    def load_company_mapping(self):
        """Load company mappings from database, ensuring case-insensitivity."""
        try:
            result = self.supabase.table('companies').select('id, name, acronym').eq('is_active', True).execute()
            for company in result.data:
                if company.get('name'):
                    self.company_name_mapping[company['name'].lower()] = company['id']
                if company.get('acronym'):
                    self.company_acronym_mapping[company['acronym'].lower()] = company['id']
            logger.info(f"Loaded {len(self.company_name_mapping)} name and {len(self.company_acronym_mapping)} acronym mappings.")
        except Exception as e:
            logger.error(f"Failed to load company mapping: {e}")

    def map_company_id(self, empresa_name: str) -> Optional[str]:
        """Map empresa name to company_id using a robust, case-insensitive strategy."""
        if not empresa_name:
            return None
        
        lower_empresa_name = empresa_name.lower()

        if lower_empresa_name in self.company_acronym_mapping:
            return self.company_acronym_mapping[lower_empresa_name]

        if lower_empresa_name in self.company_name_mapping:
            return self.company_name_mapping[lower_empresa_name]

        return self.create_company_if_not_exists(empresa_name)

    def create_company_if_not_exists(self, empresa_name: str) -> Optional[str]:
        """Create a new company if it doesn't exist, with a case-insensitive check."""
        try:
            acronym = empresa_name.lower().replace(' ', '-').replace('ã', 'a').replace('ç', 'c')
            acronym = ''.join(c for c in acronym if c.isalnum() or c == '-')

            existing_company = self.supabase.table('companies').select('id').ilike('acronym', acronym).execute()
            if existing_company.data:
                logger.warning(f"Company with acronym '{acronym}' already exists. Using existing ID.")
                return existing_company.data[0]['id']

            result = self.supabase.table('companies').insert({
                'name': empresa_name,
                'acronym': acronym,
                'is_active': True
            }).execute()
            
            if result.data:
                company_id = result.data[0]['id']
                self.company_name_mapping[empresa_name.lower()] = company_id
                self.company_acronym_mapping[acronym] = company_id
                logger.info(f"Created new company: '{empresa_name}' with ID: {company_id}")
                return company_id
            
        except Exception as e:
            logger.error(f"Failed to create company '{empresa_name}': {e}")
        
        return None

    def fetch_maintenance_data(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch data from the main maintenance orders API (consulta_os)."""
        formatted_start = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        formatted_end = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        url = f"{self.API_CONFIG['base_url_os']}?data_abertura_inicio={formatted_start}&data_abertura_fim={formatted_end}&situacao_int=0,1,2,3,4,5,6,7,8,9,10,11"
        headers = {'Content-Type': 'application/json', self.API_CONFIG['api_key_header']: self.API_CONFIG['token'], 'Usuario': self.API_CONFIG['user']}
        try:
            logger.info("Fetching maintenance data from consulta_os API...")
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Fetched {len(data)} maintenance records from API.")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Maintenance API request failed: {e}")
            return []

    def fetch_equipment_data(self) -> pd.DataFrame:
        """Fetch data from the equipment API and RENAME columns to match the database."""
        url = self.API_CONFIG['base_url_equipamento']
        headers = {
            'Content-Type': 'application/json',
            self.API_CONFIG['api_key_header']: self.API_CONFIG['token'],
            'Usuario': self.API_CONFIG['user']
        }
        try:
            logger.info("Fetching equipment data from consulta_equipamento API...")
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Fetched {len(data)} equipment records from API.")
            if not data:
                return pd.DataFrame()
            df = pd.DataFrame(data)
            column_mapping = {
                'Tag': 'tag', 'Familia': 'familia', 'Modelo': 'modelo',
                'TipoEquipamento': 'tipoequipamento', 'Fabricante': 'fabricante',
                'NSerie': 'nserie', 'Tombamento': 'tombamento', 'Cadastro': 'cadastro',
                'Instalacao': 'instalacao', 'Garantia': 'garantia', 'Verificacao': 'verificacao'
            }
            df.rename(columns=column_mapping, inplace=True)
            if 'tag' not in df.columns:
                logger.error("'tag' column not found in equipment data after renaming. Cannot merge.")
                return pd.DataFrame()
            equipment_cols = [
                'tag', 'familia', 'modelo', 'tipoequipamento', 'fabricante', 'nserie', 
                'tombamento', 'cadastro', 'instalacao', 'garantia', 'verificacao'
            ]
            for col in equipment_cols:
                if col not in df.columns:
                    df[col] = None
            df = df[equipment_cols].drop_duplicates(subset=['tag'], keep='first')
            return df
        except requests.exceptions.RequestException as e:
            logger.error(f"Equipment API request failed: {e}")
            return pd.DataFrame()

    def clean_and_transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and transform the merged DataFrame with multi-tenant support."""
        if df.empty:
            return pd.DataFrame()
        
        logger.info("Mapping company IDs...")
        df['company_id'] = df['empresa'].apply(self.map_company_id)
        
        for col in self.columns:
            if col not in df.columns:
                df[col] = None
        
        # Adiciona .copy() para garantir que estamos trabalhando em um DataFrame independente
        df = df[self.columns].copy() 
        
        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento', 
            'data_solucao', 'data_chamado', 'data_inicial_mo', 'data_fim_mo', 
            'inicio_pendencia', 'fechamento_pendencia', 'cadastro', 'instalacao', 
            'garantia', 'verificacao'
        ]

        for col in date_columns:
            # Remove inplace=True e usa atribuição direta
            df[col] = df[col].replace('', None)
            temp_series = pd.to_datetime(df[col], errors='coerce')
            df[col] = temp_series.dt.strftime('%Y-%m-%d %H:%M:%S').replace({pd.NaT: None})

        numeric_columns = ['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno', 'qtd_mo_min']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].apply(lambda x: float(x) if pd.notna(x) else None)
        
        df = df.replace({np.nan: None, 'nan': None, 'None': None, '': None})
        logger.info(f"Cleaned and transformed {len(df)} records.")
        return df

    def insert_data_to_supabase(self, df: pd.DataFrame) -> bool:
        """Insert data into Supabase using upsert."""
        if df.empty:
            logger.info("No data to insert.")
            return True
        
        try:
            records = df.to_dict('records')
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                self.supabase.table('maintenance_orders').upsert(batch, on_conflict='os, company_id').execute()
                logger.info(f"Upserted batch {i//batch_size + 1}/{len(records)//batch_size + 1}")
            logger.info(f"Successfully upserted {len(records)} records.")
            return True
        except Exception as e:
            logger.error(f"Failed to insert data to Supabase: {e}")
            return False

    def extract_and_store_data(self, days_back: int = 365) -> bool:
        """Main method to orchestrate the data extraction and storage."""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            logger.info(f"Extracting data from {start_date} to {end_date}")
            
            raw_maintenance_data = self.fetch_maintenance_data(start_date, end_date)
            if not raw_maintenance_data:
                logger.warning("No maintenance data from API. Halting.")
                return False
            
            maintenance_df = pd.DataFrame(raw_maintenance_data)
            maintenance_df.drop_duplicates(subset=['os', 'empresa'], keep='last', inplace=True)

            equipment_df = self.fetch_equipment_data()
            merged_df = pd.merge(maintenance_df, equipment_df, on='tag', how='left') if not equipment_df.empty else maintenance_df
            
            cleaned_df = self.clean_and_transform_data(merged_df)
            return self.insert_data_to_supabase(cleaned_df)
            
        except Exception as e:
            logger.error(f"An error occurred in the main process: {e}", exc_info=True)
            return False


class MultiTenantBuildingEngineeringDataExtractor:
    def __init__(self):
        # API Configuration
        self.AGIR_API_CONFIG = {
            'token': os.getenv("AGIR_API_TOKEN", "2050ee77-2cc7-47e0-8b82-4c8dda75ef5f"),
            'base_url': "https://agir.api.neovero.com/api/queries/execute/consulta_os",
            'api_key_header': "X-API-KEY"
        }

        # Supabase configuration
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY")
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        self.building_columns = [
            'empresa_id', 'empresa', 'razaosocial', 'grupo_setor', 'os', 'oficina', 'tipo', 
            'prioridade', 'complexidade', 'tag', 'patrimonio', 'sn', 'equipamento', 'setor', 
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento', 
            'data_solucao', 'data_chamado', 'ocorrencia', 'causa', 'fornecedor', 'custo_os', 
            'custo_mo', 'custo_peca', 'custo_servicoexterno', 'responsavel', 'solicitante',
            'tipomanutencao', 'situacao', 'situacao_int', 'colaborador_mo', 'data_inicial_mo',
            'data_fim_mo', 'qtd_mo_min', 'obs_mo', 'servico', 'requisicao', 'avaliacao',
            'obs_requisicao', 'pendencia', 'inicio_pendencia', 'fechamento_pendencia',
            'company_id'
        ]

        self.company_name_mapping = {}
        self.company_acronym_mapping = {}
        self.load_company_mapping()

    def load_company_mapping(self):
        """Load company mappings from database, ensuring case-insensitivity."""
        try:
            result = self.supabase.table('companies').select('id, name, acronym').eq('is_active', True).execute()
            for company in result.data:
                if company.get('name'):
                    self.company_name_mapping[company['name'].lower()] = company['id']
                if company.get('acronym'):
                    self.company_acronym_mapping[company['acronym'].lower()] = company['id']
            logger.info(f"Loaded {len(self.company_name_mapping)} name and {len(self.company_acronym_mapping)} acronym mappings for building data.")
        except Exception as e:
            logger.error(f"Failed to load company mapping for building data: {e}")

    def map_company_id(self, empresa_name: str, razao_social: str = None) -> Optional[str]:
        """Map company info to a company_id, creating the company if it doesn't exist."""
        if not empresa_name:
            return None

        name_to_check = razao_social if razao_social else empresa_name
        lower_name_to_check = name_to_check.lower()

        if lower_name_to_check in self.company_name_mapping:
            return self.company_name_mapping[lower_name_to_check]

        lower_empresa_name = empresa_name.lower()
        if lower_empresa_name in self.company_acronym_mapping:
            return self.company_acronym_mapping[lower_empresa_name]
        
        return self.create_company_from_building_data(empresa_name, razao_social)

    def create_company_from_building_data(self, empresa_name: str, razao_social: str = None) -> Optional[str]:
        """Create a new company, ensuring the acronym is unique (case-insensitive)."""
        try:
            company_name = razao_social if razao_social else empresa_name
            acronym = empresa_name.lower()

            existing_company = self.supabase.table('companies').select('id').ilike('acronym', acronym).execute()
            if existing_company.data:
                logger.warning(f"Company with acronym '{acronym}' already exists. Using existing ID.")
                return existing_company.data[0]['id']

            result = self.supabase.table('companies').insert({
                'name': company_name,
                'acronym': acronym,
                'is_active': True
            }).execute()
            
            if result.data:
                company_id = result.data[0]['id']
                self.company_name_mapping[company_name.lower()] = company_id
                self.company_acronym_mapping[acronym] = company_id
                logger.info(f"Created new company '{company_name}' with acronym '{acronym}'.")
                return company_id

        except Exception as e:
            logger.error(f"Failed to create company from building data '{empresa_name}': {e}")
        return None

    def fetch_building_data(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch building engineering data from AGIR API."""
        formatted_start = start_date.strftime("%Y-%m-%dT%H:%M")
        all_data = []
        empresa_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] # Example IDs
        situacao_ints = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        
        headers = {'Content-Type': 'application/json', self.AGIR_API_CONFIG['api_key_header']: self.AGIR_API_CONFIG['token']}

        for empresa_id in empresa_ids:
            situacao_str = ','.join(map(str, situacao_ints))
            url = f"{self.AGIR_API_CONFIG['base_url']}?data_abertura_inicio={formatted_start}&empresa_id={empresa_id}&situacao_int={situacao_str}"
            try:
                logger.info(f"Fetching building data for empresa_id={empresa_id}...")
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                if data:
                    all_data.extend(data)
                time.sleep(0.2)
            except requests.exceptions.RequestException as e:
                logger.error(f"Building API request failed for empresa_id={empresa_id}: {e}")

        logger.info(f"Total building records fetched: {len(all_data)}")
        return all_data

    def clean_and_transform_building_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean, transform, and map company IDs for building data."""
        if df.empty:
            return pd.DataFrame()

        logger.info("Mapping company IDs for building data...")
        df['company_id'] = df.apply(lambda row: self.map_company_id(row['empresa'], row.get('razaosocial')), axis=1)

        for col in self.building_columns:
            if col not in df.columns:
                df[col] = None
                
        # Adiciona .copy() para garantir que estamos trabalhando em um DataFrame independente
        df = df[self.building_columns].copy()

        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento',
            'data_solucao', 'data_chamado', 'data_inicial_mo', 'data_fim_mo',
            'inicio_pendencia', 'fechamento_pendencia'
        ]
        
        for col in date_columns:
            # Remove inplace=True e usa atribuição direta
            df[col] = df[col].replace('', None)
            temp_series = pd.to_datetime(df[col], errors='coerce')
            df[col] = temp_series.dt.strftime('%Y-%m-%d %H:%M:%S').replace({pd.NaT: None})

        numeric_columns = ['empresa_id', 'situacao_int', 'custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno', 'qtd_mo_min']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        df = df.replace({np.nan: None, 'nan': None, 'None': None, '': None})
        logger.info(f"Cleaned and transformed {len(df)} building records.")
        return df

    def insert_building_data_to_supabase(self, df: pd.DataFrame) -> bool:
        """Insert building engineering data into Supabase."""
        if df.empty:
            return True
        try:
            records = df.to_dict('records')
            # <<< ALTERAÇÃO AQUI >>>
            # Reduzindo o tamanho do lote para evitar o timeout
            batch_size = 50 
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                self.supabase.table('building_orders').upsert(batch, on_conflict='os, company_id').execute()
                logger.info(f"Upserted building batch {i//batch_size + 1}")
            return True
        except Exception as e:
            logger.error(f"Failed to insert building data: {e}")
            return False

    def extract_and_store_building_data(self, days_back: int = 730) -> bool:
        """Main method for building data extraction."""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            raw_data = self.fetch_building_data(start_date, end_date)
            if not raw_data:
                logger.warning("No building data from API.")
                return False

            building_df = pd.DataFrame(raw_data)
            building_df.drop_duplicates(subset=['os', 'empresa'], keep='last', inplace=True)
            
            cleaned_df = self.clean_and_transform_building_data(building_df)
            return self.insert_building_data_to_supabase(cleaned_df)
        except Exception as e:
            logger.error(f"An error occurred in building data extraction: {e}", exc_info=True)
            return False


def main():
    """Main function to run both data extractions."""
    logger.info("Starting Multi-Tenant Clinical Engineering Data Extraction...")
    clinical_extractor = MultiTenantMaintenanceDataExtractor()
    clinical_success = clinical_extractor.extract_and_store_data(days_back=730)
    
    if clinical_success:
        print("✅ Clinical engineering data extraction completed successfully!")
    else:
        print("❌ Clinical engineering data extraction failed. Check logs.")
    
    logger.info("Starting Multi-Tenant Building Engineering Data Extraction...")
    building_extractor = MultiTenantBuildingEngineeringDataExtractor()
    building_success = building_extractor.extract_and_store_building_data(days_back=730)
    
    if building_success:
        print("✅ Building engineering data extraction completed successfully!")
    else:
        print("❌ Building engineering data extraction failed. Check logs.")
    read 
    if clinical_success and building_success:
        print("🎉 All data extractions completed successfully!")
    else:
        print("⚠️ Some data extractions failed. Check logs for details.")


if __name__ == "__main__":
    main()