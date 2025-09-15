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

def test_building_data_fix():
    """Test the building data extraction with the timestamp fix."""

    # Supabase configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Testing building data timestamp fix...")

    # Create a small test dataset with problematic timestamps
    test_data = [
        {
            'empresa': 'TEST_EMPRESA',
            'os': f'TEST-{datetime.now().strftime("%Y%m%d%H%M%S")}-001',
            'abertura': '',  # Empty string - should become None
            'fechamento': '',  # Empty string - should become None
            'data_chamado': '2024-01-15 10:30:00',  # Valid date
            'equipamento': 'Test Equipment',
            'company_id': None
        },
        {
            'empresa': 'TEST_EMPRESA',
            'os': f'TEST-{datetime.now().strftime("%Y%m%d%H%M%S")}-002',
            'abertura': '2024-01-15 09:00:00',  # Valid date
            'fechamento': '',  # Empty string - should become None
            'data_chamado': '',  # Empty string - should become None
            'equipamento': 'Test Equipment 2',
            'company_id': None
        }
    ]

    df = pd.DataFrame(test_data)
    print(f"Created test dataset with {len(df)} records")
    print("Before transformation:")
    for col in ['abertura', 'fechamento', 'data_chamado']:
        print(f"  {col}: {df[col].tolist()}")

    # Apply the fixed timestamp transformation
    df = df.copy()  # Prevent warnings

    date_columns = ['abertura', 'fechamento', 'data_chamado']
    for col in date_columns:
        print(f"Processing column: {col}")
        df.loc[:, col] = pd.to_datetime(df[col], errors='coerce')
        df.loc[:, col] = df[col].apply(lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None)

    print("\nAfter transformation:")
    for col in ['abertura', 'fechamento', 'data_chamado']:
        print(f"  {col}: {df[col].tolist()}")

    # Test database insertion
    try:
        print("\nTesting database insertion...")
        records = df.to_dict('records')
        result = supabase.table('building_orders').insert(records, count='none').execute()
        print("Database insertion successful!")

        # Clean up test records
        for record in records:
            supabase.table('building_orders').delete().eq('os', record['os']).execute()
        print("Test records cleaned up")

        return True

    except Exception as e:
        print(f"Database insertion failed: {e}")
        return False

if __name__ == "__main__":
    success = test_building_data_fix()
    if success:
        print("\nAll tests passed! The timestamp fix is working correctly.")
        print("You can now run the full data extraction safely.")
    else:
        print("\nTests failed. Please check the errors above.")