-- Performance Testing with Real Company UUIDs
-- Run each test separately to evaluate index performance improvements

-- ############################################################################
-- ##                                                                        ##
-- ##                     TESTS FOR maintenance_orders                       ##
-- ##                                                                        ##
-- ############################################################################

-- ============================================================================
-- TEST SET A: COMPLEXO HOSPITALAR (ENGENHARIA CLÍNICA)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET B: CRER - CENTRO DE REABILITAÇÃO
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = 'db6c258a-7b74-4d78-b13a-0a841b055d7a' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET C: HDS - HOSPITAL DE DERMATOLOGIA SANITÁRIA
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = '875cb9f2-546d-451e-97d7-133f911ca159' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET D: HECAD - HOSPITAL ESTADUAL DA CRIANÇA E ADOLESCENTE
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = 'ebf885b8-4ec5-4e85-a607-2599a8c451b4' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET E: HOL
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = '76c98f56-e2b8-4714-8166-b1329f83d454' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- COMPREHENSIVE TEST: maintenance_orders (ALL COMPANIES)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  company_id,
  COUNT(*) as total_orders
FROM maintenance_orders 
WHERE company_id IN (
  '90643bc4-b566-47f3-90b9-33a02850297c', -- CEC
  'db6c258a-7b74-4d78-b13a-0a841b055d7a', -- CRER
  '875cb9f2-546d-451e-97d7-133f911ca159', -- HDS
  'ebf885b8-4ec5-4e85-a607-2599a8c451b4', -- HECAD
  '76c98f56-e2b8-4714-8166-b1329f83d454'  -- HOL
)
AND abertura >= '2024-01-01'
GROUP BY company_id;


-- ############################################################################
-- ##                                                                        ##
-- ##                      TESTS FOR building_orders                         ##
-- ##                                                                        ##
-- ############################################################################

-- ============================================================================
-- TEST SET A: COMPLEXO HOSPITALAR (ENGENHARIA CLÍNICA)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM building_orders 
WHERE company_id = '90643bc4-b566-47f3-90b9-33a02850297c' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET B: CRER - CENTRO DE REABILITAÇÃO
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM building_orders 
WHERE company_id = 'db6c258a-7b74-4d78-b13a-0a841b055d7a' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET C: HDS - HOSPITAL DE DERMATOLOGIA SANITÁRIA
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM building_orders 
WHERE company_id = '875cb9f2-546d-451e-97d7-133f911ca159' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET D: HECAD - HOSPITAL ESTADUAL DA CRIANÇA E ADOLESCENTE
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM building_orders 
WHERE company_id = 'ebf885b8-4ec5-4e85-a607-2599a8c451b4' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- TEST SET E: HOL
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM building_orders 
WHERE company_id = '76c98f56-e2b8-4714-8166-b1329f83d454' 
AND abertura >= '2024-01-01';

-- ============================================================================
-- COMPREHENSIVE TEST: building_orders (ALL COMPANIES)
-- ============================================================================
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  company_id,
  COUNT(*) as total_orders
FROM building_orders 
WHERE company_id IN (
  '90643bc4-b566-47f3-90b9-33a02850297c', -- CEC
  'db6c258a-7b74-4d78-b13a-0a841b055d7a', -- CRER
  '875cb9f2-546d-451e-97d7-133f911ca159', -- HDS
  'ebf885b8-4ec5-4e85-a607-2599a8c451b4', -- HECAD
  '76c98f56-e2b8-4714-8166-b1329f83d454'  -- HOL
)
AND abertura >= '2024-01-01'
GROUP BY company_id;