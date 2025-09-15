-- ============================================================================
-- FIXED DIAGNOSTIC QUERIES FOR REACT APPLICATION DATA LOADING ERROR
-- ============================================================================
-- Run each query separately to identify the root cause

-- ============================================================================
-- STEP 1: Check if tables exist and have data
-- ============================================================================
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

-- ============================================================================
-- STEP 2: Test basic query that the app might be running
-- ============================================================================
SELECT COUNT(*) as total_maintenance_orders
FROM maintenance_orders;

-- ============================================================================
-- STEP 3: Test company-specific query
-- ============================================================================
SELECT COUNT(*) as company_specific_count
FROM maintenance_orders 
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c';

-- ============================================================================
-- STEP 4: Test if columns exist that the app expects
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'maintenance_orders'
AND column_name IN ('id', 'empresa', 'os', 'equipamento', 'situacao', 'abertura', 'fechamento', 'company_id')
ORDER BY column_name;

-- ============================================================================
-- STEP 5: Check for data type issues (FIXED for timestamp columns)
-- ============================================================================
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura IS NOT NULL THEN 1 END) as valid_abertura,
  COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as valid_company_id,
  COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as valid_id,
  -- Check for problematic timestamp values
  COUNT(CASE WHEN abertura = '' THEN 1 END) as empty_string_abertura,
  COUNT(CASE WHEN abertura IS NULL THEN 1 END) as null_abertura
FROM maintenance_orders;

-- ============================================================================
-- STEP 6: Test sample data retrieval (like the app would do)
-- ============================================================================
SELECT id, empresa, abertura, company_id
FROM maintenance_orders
WHERE company_id IS NOT NULL
ORDER BY abertura DESC
LIMIT 5;

-- ============================================================================
-- STEP 7: Check company_id UUID format
-- ============================================================================
SELECT 
  company_id,
  LENGTH(company_id) as uuid_length,
  company_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as is_valid_uuid
FROM maintenance_orders
WHERE company_id IS NOT NULL
GROUP BY company_id
LIMIT 10;

-- ============================================================================
-- STEP 8: Test the exact query pattern the app uses (with ORDER BY)
-- ============================================================================
SELECT *
FROM maintenance_orders
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c'
ORDER BY abertura DESC
LIMIT 10;