-- ============================================================================
-- SAFE DATA DIAGNOSIS - Avoids timestamp comparison errors
-- ============================================================================
-- This uses text casting to safely identify problematic data

-- ============================================================================
-- STEP 1: Check data types of timestamp columns
-- ============================================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'maintenance_orders'
AND column_name IN ('abertura', 'fechamento', 'parada', 'funcionamento', 'data_chamado', 'data_atendimento', 'data_solucao')
ORDER BY column_name;

-- ============================================================================
-- STEP 2: Safely identify problematic values using text casting
-- ============================================================================
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura::text = '' THEN 1 END) as empty_abertura,
  COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as empty_fechamento,
  COUNT(CASE WHEN abertura IS NULL THEN 1 END) as null_abertura,
  COUNT(CASE WHEN fechamento IS NULL THEN 1 END) as null_fechamento,
  COUNT(CASE WHEN abertura IS NOT NULL AND abertura::text != '' THEN 1 END) as valid_abertura
FROM maintenance_orders;

-- ============================================================================
-- STEP 3: Check building_orders safely
-- ============================================================================
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura::text = '' THEN 1 END) as empty_abertura,
  COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as empty_fechamento,
  COUNT(CASE WHEN abertura IS NULL THEN 1 END) as null_abertura,
  COUNT(CASE WHEN fechamento IS NULL THEN 1 END) as null_fechamento,
  COUNT(CASE WHEN abertura IS NOT NULL AND abertura::text != '' THEN 1 END) as valid_abertura
FROM building_orders;

-- ============================================================================
-- STEP 4: Sample problematic records (if they exist)
-- ============================================================================
-- Show examples of problematic abertura values
SELECT 
  id,
  empresa,
  abertura::text as abertura_as_text,
  LENGTH(abertura::text) as abertura_length,
  company_id
FROM maintenance_orders
WHERE abertura::text = ''
LIMIT 5;

-- ============================================================================
-- STEP 5: Test basic data retrieval without ORDER BY timestamps
-- ============================================================================
-- This tests if basic queries work
SELECT 
  id,
  empresa,
  equipamento,
  company_id
FROM maintenance_orders
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c'
LIMIT 5;