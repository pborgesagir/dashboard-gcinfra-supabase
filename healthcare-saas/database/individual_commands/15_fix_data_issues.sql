-- ============================================================================
-- FIX DATA TYPE ISSUES THAT ARE CAUSING APPLICATION ERRORS
-- ============================================================================
-- This addresses the timestamp conversion errors found in the diagnostic

-- ============================================================================
-- STEP 1: Identify the problematic data
-- ============================================================================
-- Check for empty strings in timestamp columns
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura = '' THEN 1 END) as empty_abertura,
  COUNT(CASE WHEN fechamento = '' THEN 1 END) as empty_fechamento,
  COUNT(CASE WHEN parada = '' THEN 1 END) as empty_parada,
  COUNT(CASE WHEN funcionamento = '' THEN 1 END) as empty_funcionamento,
  COUNT(CASE WHEN data_chamado = '' THEN 1 END) as empty_data_chamado,
  COUNT(CASE WHEN data_atendimento = '' THEN 1 END) as empty_data_atendimento,
  COUNT(CASE WHEN data_solucao = '' THEN 1 END) as empty_data_solucao
FROM maintenance_orders;

-- ============================================================================
-- STEP 2: Check building_orders for same issues
-- ============================================================================
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura = '' THEN 1 END) as empty_abertura,
  COUNT(CASE WHEN fechamento = '' THEN 1 END) as empty_fechamento,
  COUNT(CASE WHEN parada = '' THEN 1 END) as empty_parada,
  COUNT(CASE WHEN funcionamento = '' THEN 1 END) as empty_funcionamento,
  COUNT(CASE WHEN data_chamado = '' THEN 1 END) as empty_data_chamado,
  COUNT(CASE WHEN data_atendimento = '' THEN 1 END) as empty_data_atendimento,
  COUNT(CASE WHEN data_solucao = '' THEN 1 END) as empty_data_solucao
FROM building_orders;

-- ============================================================================
-- STEP 3: FIX THE DATA - Replace empty strings with NULL
-- ============================================================================

-- Fix maintenance_orders table
-- WARNING: This will modify your data. Make sure you have a backup first!

-- Uncomment and run these UPDATE statements ONLY after confirming the issue

/*
UPDATE maintenance_orders 
SET abertura = NULL 
WHERE abertura = '';

UPDATE maintenance_orders 
SET fechamento = NULL 
WHERE fechamento = '';

UPDATE maintenance_orders 
SET parada = NULL 
WHERE parada = '';

UPDATE maintenance_orders 
SET funcionamento = NULL 
WHERE funcionamento = '';

UPDATE maintenance_orders 
SET data_chamado = NULL 
WHERE data_chamado = '';

UPDATE maintenance_orders 
SET data_atendimento = NULL 
WHERE data_atendimento = '';

UPDATE maintenance_orders 
SET data_solucao = NULL 
WHERE data_solucao = '';
*/

-- ============================================================================
-- STEP 4: Fix building_orders table (uncomment if needed)
-- ============================================================================

/*
UPDATE building_orders 
SET abertura = NULL 
WHERE abertura = '';

UPDATE building_orders 
SET fechamento = NULL 
WHERE fechamento = '';

UPDATE building_orders 
SET parada = NULL 
WHERE parada = '';

UPDATE building_orders 
SET funcionamento = NULL 
WHERE funcionamento = '';

UPDATE building_orders 
SET data_chamado = NULL 
WHERE data_chamado = '';

UPDATE building_orders 
SET data_atendimento = NULL 
WHERE data_atendimento = '';

UPDATE building_orders 
SET data_solucao = NULL 
WHERE data_solucao = '';
*/

-- ============================================================================
-- STEP 5: Verify the fix worked
-- ============================================================================
-- Run this after applying the updates to confirm no more empty strings

SELECT 
  'maintenance_orders' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura = '' THEN 1 END) as remaining_empty_abertura,
  COUNT(CASE WHEN fechamento = '' THEN 1 END) as remaining_empty_fechamento
FROM maintenance_orders

UNION ALL

SELECT 
  'building_orders' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN abertura = '' THEN 1 END) as remaining_empty_abertura,
  COUNT(CASE WHEN fechamento = '' THEN 1 END) as remaining_empty_fechamento
FROM building_orders;

-- ============================================================================
-- STEP 6: Test the application query pattern after fix
-- ============================================================================
-- This should work without errors after the data cleanup

SELECT *
FROM maintenance_orders
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c'
ORDER BY abertura DESC NULLS LAST
LIMIT 10;