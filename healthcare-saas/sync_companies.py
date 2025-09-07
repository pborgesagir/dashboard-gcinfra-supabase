#!/usr/bin/env python3
"""
Company Synchronization Utility

This script synchronizes the companies table based on existing data in building_orders.
Companies are created with:
- name: from razaosocial column
- slug: from name (empresa) column
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging
from typing import Dict, List, Optional
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CompanySynchronizer:
    def __init__(self):
        # Supabase configuration
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_KEY = os.getenv("SUPABASE_KEY")
        
        # Initialize Supabase client
        self.supabase: Client = create_client(self.SUPABASE_URL, self.SUPABASE_KEY)
        
        # Company mapping cache
        self.company_mapping = {}
        
    def load_existing_companies(self):
        """Load existing companies into mapping cache"""
        try:
            result = self.supabase.table('companies').select('id, name, slug').execute()
            for company in result.data:
                # Map by slug to find existing companies
                self.company_mapping[company['slug']] = {
                    'id': company['id'],
                    'name': company['name']
                }
            logger.info(f"Loaded {len(self.company_mapping)} existing companies")
        except Exception as e:
            logger.error(f"Failed to load existing companies: {e}")
    
    def get_unique_companies_from_building_orders(self) -> List[Dict]:
        """Get unique company combinations from building_orders"""
        try:
            # Fetch all data using pagination to avoid timeouts
            all_data = []
            from_offset = 0
            batch_size = 1000
            
            while True:
                logger.info(f"Fetching batch starting at {from_offset}...")
                result = self.supabase.table('building_orders')\
                    .select('empresa, razaosocial')\
                    .not_.is_('empresa', 'null')\
                    .not_.is_('razaosocial', 'null')\
                    .neq('empresa', '')\
                    .neq('razaosocial', '')\
                    .range(from_offset, from_offset + batch_size - 1)\
                    .execute()
                
                if not result.data or len(result.data) == 0:
                    break
                    
                all_data.extend(result.data)
                logger.info(f"Fetched {len(result.data)} records, total: {len(all_data)}")
                
                if len(result.data) < batch_size:
                    break  # Last batch
                    
                from_offset += batch_size
            
            # Create unique combinations
            unique_companies = {}
            for row in all_data:
                empresa = row.get('empresa')
                razaosocial = row.get('razaosocial')
                
                if empresa and razaosocial:
                    # Generate slug from empresa
                    slug = empresa.lower().replace(' ', '-').replace('ã', 'a').replace('ç', 'c')
                    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
                    
                    unique_companies[slug] = {
                        'empresa': empresa,
                        'razaosocial': razaosocial,
                        'slug': slug
                    }
            
            logger.info(f"Found {len(unique_companies)} unique company combinations in building_orders")
            return list(unique_companies.values())
            
        except Exception as e:
            logger.error(f"Failed to get unique companies from building_orders: {e}")
            return []
    
    def create_company(self, empresa: str, razaosocial: str, slug: str) -> Optional[str]:
        """Create a new company"""
        try:
            # Check if slug already exists and make it unique if needed
            original_slug = slug
            counter = 1
            while slug in self.company_mapping:
                slug = f"{original_slug}-{counter}"
                counter += 1
            
            result = self.supabase.table('companies').insert({
                'name': razaosocial,  # Use razaosocial as name
                'slug': slug,         # Use empresa as slug
                'is_active': True
            }).execute()
            
            if result.data:
                company_id = result.data[0]['id']
                self.company_mapping[slug] = {
                    'id': company_id,
                    'name': razaosocial
                }
                logger.info(f"Created company - Name: '{razaosocial}', Slug: '{slug}', ID: {company_id}")
                return company_id
                
        except Exception as e:
            logger.error(f"Failed to create company {empresa}/{razaosocial}: {e}")
        
        return None
    
    def update_company_if_needed(self, existing_company: Dict, razaosocial: str) -> bool:
        """Update company name if razaosocial has changed"""
        if existing_company['name'] != razaosocial:
            try:
                result = self.supabase.table('companies').update({
                    'name': razaosocial,
                    'updated_at': 'NOW()'
                }).eq('id', existing_company['id']).execute()
                
                if result.data:
                    logger.info(f"Updated company name from '{existing_company['name']}' to '{razaosocial}'")
                    existing_company['name'] = razaosocial
                    return True
                    
            except Exception as e:
                logger.error(f"Failed to update company {existing_company['id']}: {e}")
        
        return False
    
    def synchronize_companies(self) -> bool:
        """Main synchronization method"""
        try:
            logger.info("Starting company synchronization...")
            
            # Load existing companies
            self.load_existing_companies()
            
            # Get unique companies from building_orders
            unique_companies = self.get_unique_companies_from_building_orders()
            
            if not unique_companies:
                logger.warning("No companies found in building_orders")
                return False
            
            created_count = 0
            updated_count = 0
            
            for company_data in unique_companies:
                empresa = company_data['empresa']
                razaosocial = company_data['razaosocial']
                slug = company_data['slug']
                
                if slug in self.company_mapping:
                    # Company exists, check if name needs update
                    if self.update_company_if_needed(self.company_mapping[slug], razaosocial):
                        updated_count += 1
                else:
                    # Company doesn't exist, create it
                    if self.create_company(empresa, razaosocial, slug):
                        created_count += 1
                
                # Rate limiting
                time.sleep(0.1)
            
            logger.info(f"Synchronization completed - Created: {created_count}, Updated: {updated_count}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to synchronize companies: {e}")
            return False

def main():
    """Main function"""
    logger.info("Starting Company Synchronization Utility")
    
    synchronizer = CompanySynchronizer()
    success = synchronizer.synchronize_companies()
    
    if success:
        print("Company synchronization completed successfully!")
    else:
        print("Company synchronization failed. Check logs.")

if __name__ == "__main__":
    main()