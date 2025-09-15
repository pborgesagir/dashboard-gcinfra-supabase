-- ============================================================================
-- SAFE DATA FIX - Replace empty timestamp strings with NULL
-- ============================================================================
-- This fixes the root cause of your React application data loading error

-- ============================================================================
-- STEP 1: Fix maintenance_orders table
-- ============================================================================
-- Replace empty strings with NULL for timestamp columns

-- Fix abertura column (most critical)
UPDATE maintenance_orders 
SET abertura = NULL 
WHERE abertura::text = '';

-- Fix fechamento column
UPDATE maintenance_orders 
SET fechamento = NULL 
WHERE fechamento::text = '';

-- Fix parada column
UPDATE maintenance_orders 
SET parada = NULL 
WHERE parada::text = '';

-- Fix funcionamento column
UPDATE maintenance_orders 
SET funcionamento = NULL 
WHERE funcionamento::text = '';

-- Fix data_chamado column
UPDATE maintenance_orders 
SET data_chamado = NULL 
WHERE data_chamado::text = '';

-- Fix data_atendimento column
UPDATE maintenance_orders 
SET data_atendimento = NULL 
WHERE data_atendimento::text = '';

-- Fix data_solucao column
UPDATE maintenance_orders 
SET data_solucao = NULL 
WHERE data_solucao::text = '';

-- ============================================================================
-- STEP 2: Fix building_orders table
-- ============================================================================

-- Fix abertura column (most critical)
UPDATE building_orders 
SET abertura = NULL 
WHERE abertura::text = '';

-- Fix fechamento column
UPDATE building_orders 
SET fechamento = NULL 
WHERE fechamento::text = '';

-- Fix parada column
UPDATE building_orders 
SET parada = NULL 
WHERE parada::text = '';

-- Fix funcionamento column
UPDATE building_orders 
SET funcionamento = NULL 
WHERE funcionamento::text = '';

-- Fix data_chamado column
UPDATE building_orders 
SET data_chamado = NULL 
WHERE data_chamado::text = '';

-- Fix data_atendimento column
UPDATE building_orders 
SET data_atendimento = NULL 
WHERE data_atendimento::text = '';

-- Fix data_solucao column
UPDATE building_orders 
SET data_solucao = NULL 
WHERE data_solucao::text = '';

-- ============================================================================
-- STEP 3: Verify the fix worked
-- ============================================================================
SELECT 
  'maintenance_orders' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura::text = '' THEN 1 END) as remaining_empty_abertura,
  COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as remaining_empty_fechamento,
  COUNT(CASE WHEN abertura IS NOT NULL THEN 1 END) as valid_abertura_count
FROM maintenance_orders

UNION ALL

SELECT 
  'building_orders' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura::text = '' THEN 1 END) as remaining_empty_abertura,
  COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as remaining_empty_fechamento,
  COUNT(CASE WHEN abertura IS NOT NULL THEN 1 END) as valid_abertura_count
FROM building_orders;

-- ============================================================================
-- STEP 4: Test the application query pattern
-- ============================================================================
-- This should now work without errors after the data cleanup

SELECT 
  id,
  empresa,
  equipamento,
  abertura,
  fechamento,
  company_id
FROM maintenance_orders
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c'
ORDER BY abertura DESC NULLS LAST
LIMIT 10;

-- ============================================================================
-- STEP 5: Update table statistics after data changes
-- ============================================================================
ANALYZE maintenance_orders;
ANALYZE building_orders;