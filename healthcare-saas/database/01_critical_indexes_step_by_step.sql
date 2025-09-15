-- ============================================================================
-- PHASE 1: CRITICAL MULTI-TENANT INDEXES - STEP BY STEP EXECUTION
-- ============================================================================
-- IMPORTANT: Execute each section separately in Supabase SQL Editor
-- Do NOT run all commands at once - run them one by one
-- ============================================================================

-- STEP 1: Check current database stats before implementation
-- Copy and run this first:
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
-- STEP 2: Create company_id + date index for maintenance_orders
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_date 
ON maintenance_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Create company_id + status index for maintenance_orders
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_status 
ON maintenance_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Create company_id + date index for building_orders
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_date 
ON building_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Create company_id + status index for building_orders
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_status 
ON building_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Create user email optimization index
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;

-- ============================================================================
-- STEP 7: Create user company + role optimization index
-- Copy and run this command alone:
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_role 
ON users(company_id, role) 
WHERE is_active = true;

-- ============================================================================
-- STEP 8: Verify all indexes were created successfully
-- Copy and run this verification query:
-- ============================================================================

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

-- ============================================================================
-- STEP 9: Update table statistics for better query planning
-- Copy and run these commands (can run together):
-- ============================================================================

ANALYZE maintenance_orders;
ANALYZE building_orders;
ANALYZE users;

-- ============================================================================
-- STEP 10: Test performance (optional - replace with actual company_id)
-- Uncomment and run with a real company UUID from your database:
-- ============================================================================

-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT COUNT(*) 
-- FROM maintenance_orders 
-- WHERE company_id = 'your-actual-company-uuid-here' 
-- AND abertura >= '2024-01-01';

-- ============================================================================
-- EXECUTION SUMMARY:
-- 1. Run Step 1 to see current stats
-- 2. Run Steps 2-7 individually (each CREATE INDEX command separately)
-- 3. Run Step 8 to verify indexes were created
-- 4. Run Step 9 to update statistics
-- 5. Optionally run Step 10 to test performance
-- ============================================================================