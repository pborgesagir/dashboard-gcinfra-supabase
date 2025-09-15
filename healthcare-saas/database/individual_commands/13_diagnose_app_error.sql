-- ============================================================================
-- DIAGNOSTIC QUERIES FOR REACT APPLICATION DATA LOADING ERROR
-- ============================================================================
-- Run these queries to identify the root cause of the application error

-- Step 1: Check if tables exist and have data
SELECT 
  'maintenance_orders' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT company_id) as unique_companies,
  MIN(abertura) as oldest_record,
  MAX(abertura) as newest_record
FROM maintenance_orders
WHERE company_id IS NOT NULL

UNION ALL

SELECT 
  'building_orders' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT company_id) as unique_companies,
  MIN(abertura) as oldest_record,
  MAX(abertura) as newest_record
FROM building_orders
WHERE company_id IS NOT NULL;

-- Step 2: Test basic query that the app might be running
-- This simulates the query from DataContext.tsx
SELECT COUNT(*) as total_maintenance_orders
FROM maintenance_orders;

-- Step 3: Test company-specific query (replace with your user's company_id)
-- This tests multi-tenant filtering
SELECT COUNT(*) as company_specific_count
FROM maintenance_orders 
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c';

-- Step 4: Test if columns exist that the app expects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'maintenance_orders'
AND column_name IN ('id', 'empresa', 'os', 'equipamento', 'situacao', 'abertura', 'fechamento', 'company_id')
ORDER BY column_name;

-- Step 5: Check for any data type issues
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura IS NOT NULL AND abertura != '' THEN 1 END) as valid_abertura,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as valid_company_id,
  COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as valid_id
FROM maintenance_orders;

-- Step 6: Test ordering that might be causing issues
SELECT id, empresa, abertura, company_id
FROM maintenance_orders
WHERE company_id IS NOT NULL
ORDER BY abertura DESC
LIMIT 5;

-- Step 7: Check for any potential issues with company_id formatting
SELECT 
  company_id,
  LENGTH(company_id) as uuid_length,
  company_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as is_valid_uuid
FROM maintenance_orders
WHERE company_id IS NOT NULL
GROUP BY company_id, LENGTH(company_id), company_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
LIMIT 10;