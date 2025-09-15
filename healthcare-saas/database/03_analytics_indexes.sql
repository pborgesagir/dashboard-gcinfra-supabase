-- ============================================================================
-- PHASE 3: ADVANCED ANALYTICS OPTIMIZATION INDEXES
-- ============================================================================
-- Execute these indexes AFTER Phase 2 is complete and performing well
-- These optimize cost analysis, equipment categorization, and cause analysis
-- ============================================================================

-- ============================================================================
-- 3.1 COST ANALYSIS INDEXES
-- ============================================================================

-- Optimize cost-related queries for financial dashboards
-- Using INCLUDE to store cost values directly in the index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_costs 
ON maintenance_orders(company_id, abertura) 
INCLUDE (custo_os, custo_mo, custo_peca, custo_servicoexterno) 
WHERE company_id IS NOT NULL AND custo_os IS NOT NULL;

-- Building orders cost analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_costs 
ON building_orders(company_id, abertura) 
INCLUDE (custo_os, custo_mo, custo_peca, custo_servicoexterno) 
WHERE company_id IS NOT NULL AND custo_os IS NOT NULL;

-- Cost analysis by equipment type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_equipment_costs 
ON maintenance_orders(company_id, equipamento, abertura) 
INCLUDE (custo_os) 
WHERE company_id IS NOT NULL AND equipamento IS NOT NULL AND custo_os IS NOT NULL;

-- ============================================================================
-- 3.2 EQUIPMENT FAMILY AND CATEGORY ANALYSIS
-- ============================================================================

-- Equipment family analysis for categorization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_familia 
ON maintenance_orders(company_id, familia, abertura) 
WHERE company_id IS NOT NULL AND familia IS NOT NULL;

-- Manufacturer analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_fabricante 
ON maintenance_orders(company_id, fabricante) 
WHERE company_id IS NOT NULL AND fabricante IS NOT NULL;

-- Root cause analysis with date for trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_causa 
ON maintenance_orders(company_id, causa, abertura) 
WHERE company_id IS NOT NULL AND causa IS NOT NULL;

-- Equipment model analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_modelo 
ON maintenance_orders(company_id, modelo) 
WHERE company_id IS NOT NULL AND modelo IS NOT NULL;

-- Equipment type categorization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_tipoequipamento 
ON maintenance_orders(company_id, tipoequipamento) 
WHERE company_id IS NOT NULL AND tipoequipamento IS NOT NULL;

-- ============================================================================
-- 3.3 SERVICE AND SUPPLIER ANALYSIS
-- ============================================================================

-- Service provider analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_fornecedor 
ON maintenance_orders(company_id, fornecedor, abertura) 
WHERE company_id IS NOT NULL AND fornecedor IS NOT NULL;

-- Responsible technician analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_responsavel 
ON maintenance_orders(company_id, responsavel, abertura) 
WHERE company_id IS NOT NULL AND responsavel IS NOT NULL;

-- Service request analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_solicitante 
ON maintenance_orders(company_id, solicitante) 
WHERE company_id IS NOT NULL AND solicitante IS NOT NULL;

-- ============================================================================
-- 3.4 WORKSHOP AND OFFICE ANALYSIS
-- ============================================================================

-- Workshop/office analysis for resource allocation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_oficina 
ON maintenance_orders(company_id, oficina, abertura) 
WHERE company_id IS NOT NULL AND oficina IS NOT NULL;

-- Building orders workshop analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_oficina 
ON building_orders(company_id, oficina, abertura) 
WHERE company_id IS NOT NULL AND oficina IS NOT NULL;

-- ============================================================================
-- 3.5 DOWNTIME ANALYSIS INDEXES
-- ============================================================================

-- Downtime analysis (parada to funcionamento)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_downtime 
ON maintenance_orders(company_id, parada, funcionamento) 
WHERE company_id IS NOT NULL AND parada IS NOT NULL AND funcionamento IS NOT NULL;

-- Service time analysis (abertura to fechamento)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_service_time 
ON maintenance_orders(company_id, abertura, fechamento) 
WHERE company_id IS NOT NULL AND abertura IS NOT NULL AND fechamento IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all Phase 3 indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as "Times Used"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND (
  indexname LIKE '%costs%' OR
  indexname LIKE '%familia%' OR
  indexname LIKE '%fabricante%' OR
  indexname LIKE '%causa%' OR
  indexname LIKE '%modelo%' OR
  indexname LIKE '%tipoequipamento%' OR
  indexname LIKE '%fornecedor%' OR
  indexname LIKE '%responsavel%' OR
  indexname LIKE '%solicitante%' OR
  indexname LIKE '%oficina%' OR
  indexname LIKE '%downtime%' OR
  indexname LIKE '%service_time%'
)
ORDER BY tablename, pg_relation_size(indexrelid) DESC;

-- Sample analytics queries to test performance

-- Cost analysis by equipment family
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT 
--   familia,
--   COUNT(*) as total_orders,
--   AVG(custo_os) as avg_cost,
--   SUM(custo_os) as total_cost
-- FROM maintenance_orders 
-- WHERE company_id = 'your-company-uuid'
-- AND abertura >= '2024-01-01'
-- AND familia IS NOT NULL
-- AND custo_os IS NOT NULL
-- GROUP BY familia 
-- ORDER BY total_cost DESC;

-- Root cause analysis
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT 
--   causa,
--   COUNT(*) as frequency,
--   AVG(EXTRACT(days FROM (fechamento::date - abertura::date))) as avg_resolution_days
-- FROM maintenance_orders 
-- WHERE company_id = 'your-company-uuid'
-- AND abertura >= '2024-01-01'
-- AND causa IS NOT NULL
-- AND fechamento IS NOT NULL
-- GROUP BY causa 
-- ORDER BY frequency DESC
-- LIMIT 20;

-- Update statistics
ANALYZE maintenance_orders;
ANALYZE building_orders;