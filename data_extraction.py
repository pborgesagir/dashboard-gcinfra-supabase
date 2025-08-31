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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MaintenanceDataExtractor:
    def __init__(self):
        # Configuration
        self.API_CONFIG = {
            'token': os.getenv("API_TOKEN"),
            'user': os.getenv("API_USER"),
            'base_url': "https://sesgo.api.neovero.com/api/queries/execute/consulta_os",
            'api_key_header': "X-API-KEY"
        }

        # Supabase configuration
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY")

        # Initialize Supabase client
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        # Column mapping based on your Google Apps Script
        self.columns = [
            'empresa', 'razaosocial', 'grupo_setor', 'os', 'oficina', 'tipo', 'prioridade',
            'complexidade', 'tag', 'patrimonio', 'sn', 'equipamento', 'setor', 'abertura',
            'parada', 'funcionamento', 'fechamento', 'data_atendimento', 'data_solucao',
            'data_chamado', 'ocorrencia', 'causa', 'fornecedor', 'custo_os', 'custo_mo',
            'custo_peca', 'custo_servicoexterno', 'responsavel', 'solicitante',
            'tipomanutencao', 'situacao', 'colaborador_mo', 'data_inicial_mo',
            'data_fim_mo', 'qtd_mo_min', 'obs_mo', 'servico', 'requisicao', 'avaliacao',
            'obs_requisicao', 'pendencia', 'inicio_pendencia', 'fechamento_pendencia'
        ]

    def create_table_if_not_exists(self):
        """
        Create the maintenance_orders table in Supabase if it doesn't exist
        Note: You need to run this SQL manually in your Supabase SQL editor first time
        """
        logger.info("Checking if table exists...")
        try:
            # Try to query the table to see if it exists
            result = self.supabase.table('maintenance_orders').select('id').limit(1).execute()
            logger.info("Table 'maintenance_orders' already exists")
        except Exception as e:
            logger.warning(f"Table might not exist: {e}")
            logger.info("Please create the table manually in Supabase SQL editor with this SQL:")
            
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS maintenance_orders (
                id SERIAL PRIMARY KEY,
                empresa TEXT,
                razaosocial TEXT,
                grupo_setor TEXT,
                os TEXT,
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
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_maintenance_orders_os ON maintenance_orders(os);
            CREATE INDEX IF NOT EXISTS idx_maintenance_orders_abertura ON maintenance_orders(abertura);
            CREATE INDEX IF NOT EXISTS idx_maintenance_orders_equipamento ON maintenance_orders(equipamento);
            CREATE INDEX IF NOT EXISTS idx_maintenance_orders_situacao ON maintenance_orders(situacao);
            """
            
            print("\n" + "="*80)
            print("PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:")
            print("="*80)
            print(create_table_sql)
            print("="*80)

    def fetch_data_from_api(self, start_date: datetime, end_date: datetime) -> List[Dict]:
        """
        Fetch data from the maintenance API
        """
        # Format dates for API
        formatted_start = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        formatted_end = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"{self.API_CONFIG['base_url']}?" \
              f"data_abertura_inicio={formatted_start}&" \
              f"data_abertura_fim={formatted_end}&" \
              f"situacao_int=0,1,2,3,4,5,6,7,8,9,10,11"
        
        headers = {
            'Content-Type': 'application/json',
            self.API_CONFIG['api_key_header']: self.API_CONFIG['token'],
            'Usuario': self.API_CONFIG['user']
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched {len(data)} records from API")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            return []

    def clean_and_transform_data(self, raw_data: List[Dict]) -> pd.DataFrame:
        """
        Clean and transform the raw data into a pandas DataFrame
        """
        if not raw_data:
            return pd.DataFrame()
        
        # Create DataFrame
        df = pd.DataFrame(raw_data)
        
        # Ensure all required columns exist
        for col in self.columns:
            if col not in df.columns:
                df[col] = None
        
        # Select only the columns we need in the correct order
        df = df[self.columns]
        
        # Convert date columns to datetime and then to string for JSON serialization
        date_columns = [
            'abertura', 'parada', 'funcionamento', 'fechamento',
            'data_atendimento', 'data_solucao', 'data_chamado',
            'data_inicial_mo', 'data_fim_mo', 'inicio_pendencia', 'fechamento_pendencia'
        ]
        
        for col in date_columns:
            if col in df.columns:
                # Convert to datetime first
                df[col] = pd.to_datetime(df[col], errors='coerce')
                # Convert to ISO format string for JSON serialization (or None for NaT)
                df[col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)
        
        # Convert numeric columns and handle NaN properly
        numeric_columns = ['custo_os', 'custo_mo', 'custo_peca', 'custo_servicoexterno', 'qtd_mo_min']
        for col in numeric_columns:
            if col in df.columns:
                # Convert to numeric, coercing errors to NaN
                df[col] = pd.to_numeric(df[col], errors='coerce')
                # Replace NaN with None for JSON serialization
                df[col] = df[col].apply(lambda x: float(x) if pd.notna(x) and not pd.isna(x) else None)
        
        # Clean all remaining columns - replace NaN, empty strings, and 'nan' strings with None
        for col in df.columns:
            df[col] = df[col].apply(lambda x: None if (
                pd.isna(x) or 
                pd.isnull(x) or 
                x == '' or 
                str(x).lower() == 'nan' or
                str(x).lower() == 'none' or
                (isinstance(x, float) and (pd.isna(x) or np.isinf(x)))
            ) else x)
        
        # Final cleanup: ensure all remaining values are JSON serializable
        for col in df.columns:
            df[col] = df[col].apply(lambda x: str(x) if x is not None and not isinstance(x, (int, float, str, bool, type(None))) else x)
        
        logger.info(f"Cleaned and transformed {len(df)} records")
        return df

    def debug_data_issues(self, df: pd.DataFrame) -> None:
        """
        Debug function to identify data serialization issues
        """
        logger.info("Debugging data for JSON serialization issues...")
        
        problem_found = False
        
        # Check for NaN values
        for col in df.columns:
            nan_count = df[col].isna().sum()
            if nan_count > 0:
                logger.warning(f"Column '{col}' has {nan_count} NaN values")
        
        # Check for specific problematic values
        for col in df.columns:
            unique_values = df[col].unique()
            for val in unique_values:
                if val is not None:
                    val_str = str(val).lower()
                    if 'nan' in val_str or 'inf' in val_str or val_str == 'none':
                        logger.warning(f"Problematic value in column '{col}': {val}")
                        problem_found = True
        
        if not problem_found:
            logger.info("No obvious data serialization issues found")

    def insert_data_to_supabase(self, df: pd.DataFrame) -> bool:
        """
        Insert data into Supabase
        """
        if df.empty:
            logger.info("No data to insert")
            return True
        
        # Debug data before insertion
        self.debug_data_issues(df)
        
        try:
            # Convert DataFrame to list of dictionaries
            records = df.to_dict('records')
            
            # Clean records one more time to ensure JSON compatibility
            cleaned_records = []
            for record in records:
                cleaned_record = {}
                for key, value in record.items():
                    # Handle different types of problematic values
                    if pd.isna(value) or pd.isnull(value):
                        cleaned_record[key] = None
                    elif isinstance(value, float) and (pd.isna(value) or np.isinf(value)):
                        cleaned_record[key] = None
                    elif str(value).lower() in ['nan', 'none', '']:
                        cleaned_record[key] = None
                    else:
                        cleaned_record[key] = value
                cleaned_records.append(cleaned_record)
            
            # Insert data in batches to avoid timeout
            batch_size = 100
            total_inserted = 0
            
            for i in range(0, len(cleaned_records), batch_size):
                batch = cleaned_records[i:i + batch_size]
                
                try:
                    # Use upsert to handle duplicates (assuming 'os' is unique identifier)
                    result = self.supabase.table('maintenance_orders').upsert(
                        batch, 
                        on_conflict='os'
                    ).execute()
                    
                    total_inserted += len(batch)
                    logger.info(f"Inserted batch {i//batch_size + 1}, total: {total_inserted}/{len(cleaned_records)}")
                    
                except Exception as batch_error:
                    logger.error(f"Error inserting batch {i//batch_size + 1}: {batch_error}")
                    
                    # Try to identify the problematic record
                    for j, record in enumerate(batch):
                        try:
                            single_result = self.supabase.table('maintenance_orders').upsert(
                                [record], 
                                on_conflict='os'
                            ).execute()
                            total_inserted += 1
                        except Exception as single_error:
                            logger.error(f"Problematic record at index {i+j}: {single_error}")
                            logger.error(f"Record data: {record}")
                
                # Small delay to avoid rate limiting
                time.sleep(0.1)
            
            logger.info(f"Successfully inserted {total_inserted} records to Supabase")
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert data to Supabase: {e}")
            return False

    def extract_and_store_data(self, days_back: int = 365) -> bool:
        """
        Main method to extract data and store in Supabase
        """
        try:
            # Create table if it doesn't exist
            self.create_table_if_not_exists()
            
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            logger.info(f"Extracting data from {start_date} to {end_date}")
            
            # Fetch data from API
            raw_data = self.fetch_data_from_api(start_date, end_date)
            
            if not raw_data:
                logger.warning("No data received from API")
                return False
            
            # Clean and transform data
            df = self.clean_and_transform_data(raw_data)
            
            # Insert data to Supabase
            success = self.insert_data_to_supabase(df)
            
            return success
            
        except Exception as e:
            logger.error(f"Error in extract_and_store_data: {e}")
            return False


def main():
    """
    Main function to run the data extraction
    """
    extractor = MaintenanceDataExtractor()
    
    # Extract and store data for the last two years
    success = extractor.extract_and_store_data(days_back=730)
    
    if success:
        print("✅ Data extraction and storage completed successfully!")
    else:
        print("❌ Data extraction failed. Check logs for details.")


if __name__ == "__main__":
    main()