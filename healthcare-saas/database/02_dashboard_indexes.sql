-- ============================================================================
-- PHASE 2: DASHBOARD QUERY OPTIMIZATION INDEXES
-- ============================================================================
-- Execute these indexes AFTER Phase 1 is complete and verified
-- These optimize the most common dashboard filtering and analysis queries
-- ============================================================================

-- ============================================================================
-- 2.1 DATE-RANGE QUERY OPTIMIZATION
-- ============================================================================

-- Critical for dashboard date filtering and trend analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_date_range 
ON maintenance_orders(company_id, abertura, fechamento) 
WHERE company_id IS NOT NULL AND abertura IS NOT NULL;

-- Status with date for temporal analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_status_date 
ON maintenance_orders(company_id, situacao, abertura) 
WHERE company_id IS NOT NULL AND situacao IS NOT NULL;

-- Date range optimization for building orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_date_range 
ON building_orders(company_id, abertura, fechamento) 
WHERE company_id IS NOT NULL AND abertura IS NOT NULL;

-- Status with date for building orders temporal analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_status_date 
ON building_orders(company_id, situacao, abertura) 
WHERE company_id IS NOT NULL AND situacao IS NOT NULL;

-- ============================================================================
-- 2.2 PRIORITY AND TYPE FILTERING
-- ============================================================================

-- Optimize priority filtering with date for trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_priority 
ON maintenance_orders(company_id, prioridade, abertura) 
WHERE company_id IS NOT NULL AND prioridade IS NOT NULL;

-- Maintenance type filtering with date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_type 
ON maintenance_orders(company_id, tipomanutencao, abertura) 
WHERE company_id IS NOT NULL AND tipomanutencao IS NOT NULL;

-- Complexity filtering with date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_complexity 
ON maintenance_orders(company_id, complexidade, abertura) 
WHERE company_id IS NOT NULL AND complexidade IS NOT NULL;

-- Building orders priority filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_priority 
ON building_orders(company_id, prioridade, abertura) 
WHERE company_id IS NOT NULL AND prioridade IS NOT NULL;

-- Building orders type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_type 
ON building_orders(company_id, tipomanutencao, abertura) 
WHERE company_id IS NOT NULL AND tipomanutencao IS NOT NULL;

-- ============================================================================
-- 2.3 EQUIPMENT AND ASSET OPTIMIZATION
-- ============================================================================

-- Equipment name filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_equipment 
ON maintenance_orders(company_id, equipamento) 
WHERE company_id IS NOT NULL AND equipamento IS NOT NULL;

-- Asset tag filtering (very common in maintenance systems)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_tag 
ON maintenance_orders(company_id, tag) 
WHERE company_id IS NOT NULL AND tag IS NOT NULL;

-- Patrimonio/Asset number filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_patrimonio 
ON maintenance_orders(company_id, patrimonio) 
WHERE company_id IS NOT NULL AND patrimonio IS NOT NULL;

-- Sector/Department filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_setor 
ON maintenance_orders(company_id, setor) 
WHERE company_id IS NOT NULL AND setor IS NOT NULL;

-- Building orders equipment filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_equipment 
ON building_orders(company_id, equipamento) 
WHERE company_id IS NOT NULL AND equipamento IS NOT NULL;

-- Building orders sector filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_setor 
ON building_orders(company_id, setor) 
WHERE company_id IS NOT NULL AND setor IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all Phase 2 indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND (
  indexname LIKE '%date_range%' OR
  indexname LIKE '%priority%' OR
  indexname LIKE '%type%' OR
  indexname LIKE '%complexity%' OR
  indexname LIKE '%equipment%' OR
  indexname LIKE '%tag%' OR
  indexname LIKE '%patrimonio%' OR
  indexname LIKE '%setor%'
)
ORDER BY tablename, indexname;

-- Test dashboard queries performance
-- Priority distribution query test
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT prioridade, COUNT(*) 
-- FROM maintenance_orders 
-- WHERE company_id = 'your-company-uuid' 
-- AND abertura >= '2024-01-01' 
-- GROUP BY prioridade;

-- Equipment filtering query test
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT equipamento, COUNT(*) 
-- FROM maintenance_orders 
-- WHERE company_id = 'your-company-uuid' 
-- AND equipamento IS NOT NULL
-- GROUP BY equipamento 
-- ORDER BY COUNT(*) DESC 
-- LIMIT 20;

-- Update table statistics
ANALYZE maintenance_orders;
ANALYZE building_orders;