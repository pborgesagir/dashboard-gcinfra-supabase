-- ============================================================================
-- PHASE 1: CRITICAL MULTI-TENANT INDEXES
-- ============================================================================
-- Execute these indexes FIRST - they are essential for multi-tenant performance
-- Run during low traffic periods as they may take time on large tables
-- ============================================================================

-- Check current database stats before implementation
SELECT 
  schemaname,
  relname as tablename,
  n_tup_ins as "Inserts",
  n_tup_upd as "Updates", 
  n_tup_del as "Deletes",
  n_live_tup as "Live Rows",
  n_dead_tup as "Dead Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND relname IN ('maintenance_orders', 'building_orders', 'companies', 'users')
ORDER BY n_live_tup DESC;

-- ============================================================================
-- 1.1 COMPANY-BASED PARTITION INDEXES
-- ============================================================================

-- Enhanced company_id index with date filtering for maintenance_orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_date 
ON maintenance_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

-- Company_id with status filtering for maintenance_orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_status 
ON maintenance_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;

-- Enhanced company_id index with date filtering for building_orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_date 
ON building_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

-- Company_id with status filtering for building_orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_status 
ON building_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- 1.2 USER ACCESS OPTIMIZATION
-- ============================================================================

-- Optimize user authentication queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;

-- Optimize user authorization queries (company + role)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_role 
ON users(company_id, role) 
WHERE is_active = true;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND (
  indexname LIKE '%company_date%' OR
  indexname LIKE '%company_status%' OR
  indexname LIKE '%email_active%' OR
  indexname LIKE '%company_role%'
)
ORDER BY tablename, indexname;

-- Test multi-tenant query performance (replace with actual company_id)
-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT COUNT(*) 
-- FROM maintenance_orders 
-- WHERE company_id = 'your-actual-company-uuid-here' 
-- AND abertura >= '2024-01-01';

ANALYZE maintenance_orders;
ANALYZE building_orders;
ANALYZE users;