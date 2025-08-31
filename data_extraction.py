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
            # New columns from equipment API
            'familia', 'modelo', 'tipoequipamento', 'fabricante', 'nserie', 
            'tombamento', 'cadastro', 'instalacao', 'garantia', 'verificacao'
        ]

    def create_table_if_not_exists(self):
        """
        Logs the SQL command needed to create the table.
        Note: The user should run the ALTER TABLE script for existing tables.
        This CREATE script is for setting up a new environment.
        """
        create_table_sql = """
        -- This script is for creating the table from scratch.
        -- If your table already exists, use the ALTER TABLE command instead.
        CREATE TABLE IF NOT EXISTS maintenance_orders (
            id SERIAL PRIMARY KEY,
            empresa TEXT,
            razaosocial TEXT,
            grupo_setor TEXT,
            os TEXT UNIQUE,
            oficina TEXT,
            tipo TEXT,
            prioridade TEXT,
            complexidade TEXT,
            tag TEXT,
            patrimonio TEXT,
            sn TEXT,
            equipamento TEXT,
            setor TEXT,
            abertura TIMESTAMP,
            parada TIMESTAMP,
            funcionamento TIMESTAMP,
            fechamento TIMESTAMP,
            data_atendimento TIMESTAMP,
            data_solucao TIMESTAMP,
            data_chamado TIMESTAMP,
            ocorrencia TEXT,
            causa TEXT,
            fornecedor TEXT,
            custo_os NUMERIC,
            custo_mo NUMERIC,
            custo_peca NUMERIC,
            custo_servicoexterno NUMERIC,
            responsavel TEXT,
            solicitante TEXT,
            tipomanutencao TEXT,
            situacao TEXT,
            colaborador_mo TEXT,
            data_inicial_mo TIMESTAMP,
            data_fim_mo TIMESTAMP,
            qtd_mo_min NUMERIC,
            obs_mo TEXT,
            servico TEXT,
            requisicao TEXT,
            avaliacao TEXT,
            obs_requisicao TEXT,
            pendencia TEXT,
            inicio_pendencia TIMESTAMP,
            fechamento_pendencia TIMESTAMP,
            -- New columns
            familia TEXT,
            modelo TEXT,
            tipoequipamento TEXT,
            fabricante TEXT,
            nserie TEXT,
            tombamento TEXT,
            cadastro TIMESTAMP,
            instalacao TIMESTAMP,
            garantia TIMESTAMP,
            verificacao TIMESTAMP,
            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_maintenance_orders_os ON maintenance_orders(os);
        CREATE INDEX IF NOT EXISTS idx_maintenance_orders_tag ON maintenance_orders(tag);
        CREATE INDEX IF NOT EXISTS idx_maintenance_orders_abertura ON maintenance_orders(abertura);
        CREATE INDEX IF NOT EXISTS idx_maintenance_orders_equipamento ON maintenance_orders(equipamento);
        CREATE INDEX IF NOT EXISTS idx_maintenance_orders_situacao ON maintenance_orders(situacao);
        """
        logger.info("The required table can be created with the following SQL command:")
        print(create_table_sql)


    def fetch_maintenance_data(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """
        Fetch data from the main maintenance orders API (consulta_os).
        """
        formatted_start = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        formatted_end = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"{self.API_CONFIG['base_url_os']}?" \
              f"data_abertura_inicio={formatted_start}&" \
              f"data_abertura_fim={formatted_end}&" \
              f"situacao_int=0,1,2,3,4,5,6,7,8,9,10,11"
        
        headers = {
            'Content-Type': 'application/json',
            self.API_CONFIG['api_key_header']: self.API_CONFIG['token'],
            'Usuario': self.API_CONFIG['user']
        }
        
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
        """
        Fetch data from the equipment API (consulta_equipamento).
        """
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
            
            # Create DataFrame and select/rename columns to match the new table columns
            df = pd.DataFrame(data)
            
            # IMPORTANT: Rename columns from the API response to match your table schema
            # This assumes the API returns columns with the same names. If not, rename them.
            # Example: df.rename(columns={'api_col_name': 'table_col_name'}, inplace=True)
            
            # Select only the relevant equipment columns to avoid duplicates from main data
            equipment_cols = [
                'tag', 'familia', 'modelo', 'tipoequipamento', 'fabricante', 
                'nserie', 'tombamento', 'cadastro', 'instalacao', 'garantia', 'verificacao'
            ]
            
            # Ensure all required columns exist, adding them with None if they don't
            for col in equipment_cols:
                if col not in df.columns:
                    df[col] = None
            
            # Keep only the equipment columns and remove duplicates by 'tag'
            df = df[equipment_cols].drop_duplicates(subset=['tag'], keep='first')
            
            return df
        except requests.exceptions.RequestException as e:
            logger.error(f"Equipment API request failed: {e}")
            return pd.DataFrame()

    def clean_and_transform_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and transform the merged DataFrame.
        """
        if df.empty:
            return pd.DataFrame()
        
        # Ensure all required columns from the final table exist in the DataFrame
        for col in self.columns:
            if col not in df.columns:
                df[col] = None
        
        # Select only the columns we need in the correct order
        df = df[self.columns]
        
        # Convert date columns
        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento',
            'data_atendimento', 'data_solucao', 'data_chamado',
            'data_inicial_mo', 'data_fim_mo', 'inicio_pendencia', 'fechamento_pendencia',
            'cadastro', 'instalacao', 'garantia', 'verificacao' # New date columns
        ]
        for col in date_columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)
        
        # Convert numeric columns
        numeric_columns = ['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno', 'qtd_mo_min']
        for col in numeric_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].apply(lambda x: float(x) if pd.notna(x) else None)
        
        # Replace all forms of null/NaN with None for JSON compatibility
        df = df.replace({np.nan: None, 'nan': None, 'None': None, '': None})
        
        logger.info(f"Cleaned and transformed {len(df)} records.")
        return df

    def insert_data_to_supabase(self, df: pd.DataFrame) -> bool:
        """
        Insert data into Supabase using upsert.
        """
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
                    self.supabase.table('maintenance_orders').upsert(
                        batch, 
                        on_conflict='os'
                    ).execute()
                    total_inserted += len(batch)
                    logger.info(f"Upserted batch {i//batch_size + 1}, total: {total_inserted}/{len(records)}")
                except Exception as batch_error:
                    logger.error(f"Error upserting batch {i//batch_size + 1}: {batch_error}")
                    # Optional: Add single-record insertion here for debugging if needed
                time.sleep(0.1)
            
            logger.info(f"Successfully upserted {total_inserted} records to Supabase.")
            return True
        except Exception as e:
            logger.error(f"Failed to insert data to Supabase: {e}")
            return False

    def extract_and_store_data(self, days_back: int = 365) -> bool:
        """
        Main method to fetch from both APIs, merge, clean, and store in Supabase.
        """
        try:
            # Date range for the main maintenance query
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            logger.info(f"Extracting data from {start_date} to {end_date}")
            
            # 1. Fetch main maintenance data
            raw_maintenance_data = self.fetch_maintenance_data(start_date, end_date)
            if not raw_maintenance_data:
                logger.warning("No maintenance data received from API. Halting process.")
                return False
            maintenance_df = pd.DataFrame(raw_maintenance_data)
            
            # 2. Fetch equipment data
            equipment_df = self.fetch_equipment_data()
            
            # 3. Merge dataframes
            if not equipment_df.empty:
                logger.info(f"Merging maintenance data ({maintenance_df.shape[0]} rows) with equipment data ({equipment_df.shape[0]} rows) on 'tag'.")
                # Perform a left merge to keep all maintenance orders
                merged_df = pd.merge(maintenance_df, equipment_df, on='tag', how='left')
            else:
                logger.warning("Equipment data is empty. Proceeding without merging.")
                merged_df = maintenance_df

            # 4. Clean and transform the merged data
            cleaned_df = self.clean_and_transform_data(merged_df)
            
            # 5. Insert data to Supabase
            success = self.insert_data_to_supabase(cleaned_df)
            
            return success
            
        except Exception as e:
            logger.error(f"An error occurred in the main process: {e}", exc_info=True)
            return False

def main():
    """
    Main function to run the data extraction.
    """
    extractor = MaintenanceDataExtractor()
    success = extractor.extract_and_store_data(days_back=730) # Extract data for the last 2 years
    
    if success:
        print("✅ Data extraction and storage completed successfully!")
    else:
        print("❌ Data extraction failed. Check logs for details.")

if __name__ == "__main__":
    main()