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

class MaintenanceDataExtractor:
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

        # Initialize Supabase client
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        # Column mapping including the new columns
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
            'tombamento', 'cadastro', 'instalacao', 'garantia', 'verificacao'
        ]

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
        """Clean and transform the merged DataFrame."""
        if df.empty:
            return pd.DataFrame()
        for col in self.columns:
            if col not in df.columns:
                df[col] = None
        df = df[self.columns]
        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento', 
            'data_solucao', 'data_chamado', 'data_inicial_mo', 'data_fim_mo', 
            'inicio_pendencia', 'fechamento_pendencia', 'cadastro', 'instalacao', 
            'garantia', 'verificacao'
        ]
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)
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
            total_inserted = 0
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    self.supabase.table('maintenance_orders').upsert(batch, on_conflict='os').execute()
                    total_inserted += len(batch)
                    logger.info(f"Upserted batch {i//batch_size + 1}, total: {total_inserted}/{len(records)}")
                except Exception as batch_error:
                    logger.error(f"Error upserting batch {i//batch_size + 1}: {batch_error}")
                time.sleep(0.1)
            logger.info(f"Successfully upserted {total_inserted} records to Supabase.")
            return True
        except Exception as e:
            logger.error(f"Failed to insert data to Supabase: {e}")
            return False

    def extract_and_store_data(self, days_back: int = 365) -> bool:
        """Main method to fetch from both APIs, merge, clean, and store in Supabase."""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            logger.info(f"Extracting data from {start_date} to {end_date}")
            raw_maintenance_data = self.fetch_maintenance_data(start_date, end_date)
            if not raw_maintenance_data:
                logger.warning("No maintenance data received from API. Halting process.")
                return False
            maintenance_df = pd.DataFrame(raw_maintenance_data)
            
            initial_rows = len(maintenance_df)
            maintenance_df.drop_duplicates(subset=['os'], keep='last', inplace=True)
            final_rows = len(maintenance_df)
            if initial_rows > final_rows:
                logger.info(f"Removed {initial_rows - final_rows} duplicate 'os' records.")

            equipment_df = self.fetch_equipment_data()
            if not equipment_df.empty:
                logger.info(f"Merging maintenance data ({maintenance_df.shape[0]} rows) with equipment data ({equipment_df.shape[0]} rows) on 'tag'.")
                merged_df = pd.merge(maintenance_df, equipment_df, on='tag', how='left')
            else:
                logger.warning("Equipment data is empty. Proceeding without merging.")
                merged_df = maintenance_df
            
            cleaned_df = self.clean_and_transform_data(merged_df)
            success = self.insert_data_to_supabase(cleaned_df)
            return success
        except Exception as e:
            logger.error(f"An error occurred in the main process: {e}", exc_info=True)
            return False


class BuildingEngineeringDataExtractor:
    def __init__(self):
        # AGIR API Configuration
        self.AGIR_API_CONFIG = {
            'token': os.getenv("AGIR_API_TOKEN", "2050ee77-2cc7-47e0-8b82-4c8dda75ef5f"),
            'user': os.getenv("AGIR_API_USER", "kaio"),
            'email': os.getenv("AGIR_API_EMAIL", "adm.infraestrutura@hugol.org.br"),
            'base_url': "https://agir.api.neovero.com/api/queries/execute/consulta_os",
            'api_key_header': "X-API-KEY"
        }

        # Supabase configuration (reuse existing)
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY")
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        # Column mapping for building engineering data
        self.building_columns = [
            'empresa_id', 'empresa', 'razaosocial', 'grupo_setor', 'os', 'oficina', 'tipo', 
            'prioridade', 'complexidade', 'tag', 'patrimonio', 'sn', 'equipamento', 'setor', 
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento', 
            'data_solucao', 'data_chamado', 'ocorrencia', 'causa', 'fornecedor', 'custo_os', 
            'custo_mo', 'custo_peca', 'custo_servicoexterno', 'responsavel', 'solicitante',
            'tipomanutencao', 'situacao', 'situacao_int', 'colaborador_mo', 'data_inicial_mo',
            'data_fim_mo', 'qtd_mo_min', 'obs_mo', 'servico', 'requisicao', 'avaliacao',
            'obs_requisicao', 'pendencia', 'inicio_pendencia', 'fechamento_pendencia'
        ]

    def get_all_empresa_ids(self) -> List[int]:
        """Get all available empresa_id values. For now, using common IDs."""
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    def get_all_situacao_int(self) -> List[int]:
        """Get all available situacao_int values."""
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    def fetch_building_data(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Fetch building engineering data from AGIR API."""
        formatted_start = start_date.strftime("%Y-%m-%dT%H:%M")
        all_data = []
        
        empresa_ids = self.get_all_empresa_ids()
        situacao_ints = self.get_all_situacao_int()
        
        headers = {
            'Content-Type': 'application/json',
            self.AGIR_API_CONFIG['api_key_header']: self.AGIR_API_CONFIG['token']
        }

        for empresa_id in empresa_ids:
            situacao_str = ','.join(map(str, situacao_ints))
            url = f"{self.AGIR_API_CONFIG['base_url']}?data_abertura_inicio={formatted_start}&empresa_id={empresa_id}&situacao_int={situacao_str}"
            
            try:
                logger.info(f"Fetching building data for empresa_id={empresa_id}...")
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                if data:
                    logger.info(f"Fetched {len(data)} building records for empresa_id={empresa_id}")
                    all_data.extend(data)
                
                time.sleep(0.2)  # Rate limiting
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Building API request failed for empresa_id={empresa_id}: {e}")
                continue

        logger.info(f"Total building records fetched: {len(all_data)}")
        return all_data

    def clean_and_transform_building_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and transform building engineering data."""
        if df.empty:
            return pd.DataFrame()

        # Ensure all required columns exist
        for col in self.building_columns:
            if col not in df.columns:
                df[col] = None

        df = df[self.building_columns]

        # Clean date columns
        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento', 'data_atendimento', 
            'data_solucao', 'data_chamado', 'data_inicial_mo', 'data_fim_mo', 
            'inicio_pendencia', 'fechamento_pendencia'
        ]
        
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)

        # Clean numeric columns
        numeric_columns = ['empresa_id', 'situacao_int', 'custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno', 'qtd_mo_min']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Replace NaN values
        df = df.replace({np.nan: None, 'nan': None, 'None': None, '': None})
        
        logger.info(f"Cleaned and transformed {len(df)} building records.")
        return df

    def insert_building_data_to_supabase(self, df: pd.DataFrame) -> bool:
        """Insert building engineering data into Supabase."""
        if df.empty:
            logger.info("No building data to insert.")
            return True

        try:
            records = df.to_dict('records')
            batch_size = 100
            total_inserted = 0

            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    self.supabase.table('building_orders').upsert(batch, on_conflict='os').execute()
                    total_inserted += len(batch)
                    logger.info(f"Upserted building batch {i//batch_size + 1}, total: {total_inserted}/{len(records)}")
                except Exception as batch_error:
                    logger.error(f"Error upserting building batch {i//batch_size + 1}: {batch_error}")
                
                time.sleep(0.1)

            logger.info(f"Successfully upserted {total_inserted} building records to Supabase.")
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert building data to Supabase: {e}")
            return False

    def extract_and_store_building_data(self, days_back: int = 730) -> bool:
        """Main method to extract and store building engineering data."""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            logger.info(f"Extracting building data from {start_date} to {end_date}")

            raw_building_data = self.fetch_building_data(start_date, end_date)
            if not raw_building_data:
                logger.warning("No building data received from AGIR API.")
                return False

            building_df = pd.DataFrame(raw_building_data)
            
            # Remove duplicates based on 'os' column
            initial_rows = len(building_df)
            building_df.drop_duplicates(subset=['os'], keep='last', inplace=True)
            final_rows = len(building_df)
            if initial_rows > final_rows:
                logger.info(f"Removed {initial_rows - final_rows} duplicate building 'os' records.")

            cleaned_df = self.clean_and_transform_building_data(building_df)
            success = self.insert_building_data_to_supabase(cleaned_df)
            return success
            
        except Exception as e:
            logger.error(f"An error occurred in building data extraction: {e}", exc_info=True)
            return False


def main():
    """Main function to run both data extractions."""
    # Clinical Engineering Data Extraction
    logger.info("Starting Clinical Engineering Data Extraction...")
    clinical_extractor = MaintenanceDataExtractor()
    clinical_success = clinical_extractor.extract_and_store_data(days_back=730)
    
    if clinical_success:
        print("✅ Clinical engineering data extraction completed successfully!")
    else:
        print("❌ Clinical engineering data extraction failed. Check logs.")
    
    # Building Engineering Data Extraction
    logger.info("Starting Building Engineering Data Extraction...")
    building_extractor = BuildingEngineeringDataExtractor()
    building_success = building_extractor.extract_and_store_building_data(days_back=730)
    
    if building_success:
        print("✅ Building engineering data extraction completed successfully!")
    else:
        print("❌ Building engineering data extraction failed. Check logs.")
    
    # Overall status
    if clinical_success and building_success:
        print("🎉 All data extractions completed successfully!")
    else:
        print("⚠️ Some data extractions failed. Check logs for details.")


if __name__ == "__main__":
    main()