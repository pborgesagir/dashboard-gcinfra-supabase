-- ============================================================================
-- PHASE 5: DATABASE MONITORING AND MAINTENANCE QUERIES
-- ============================================================================
-- Use these queries to monitor index performance and maintain database health
-- Run these regularly to ensure optimal performance
-- ============================================================================

-- ============================================================================
-- 5.1 INDEX PERFORMANCE MONITORING
-- ============================================================================

-- Monitor index usage statistics
CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT 
  schemaname,
  relname as tablename,
  indexname,
  idx_scan as "Times Used",
  idx_tup_read as "Tuples Read",
  idx_tup_fetch as "Tuples Fetched",
  pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size",
  ROUND(idx_tup_read::numeric / GREATEST(idx_scan, 1), 2) as "Avg Tuples per Scan"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to find unused indexes
CREATE OR REPLACE VIEW v_unused_indexes AS
SELECT 
  schemaname,
  relname as tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as "Wasted Space",
  pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE 'pk_%'  -- Exclude primary keys
  AND indexname NOT LIKE '%_pkey' -- Exclude primary keys
ORDER BY pg_relation_size(indexrelid) DESC;

-- Query to find duplicate or redundant indexes
WITH index_details AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    regexp_replace(indexdef, '.*\((.*)\)', '\1') as columns,
    pg_relation_size(indexrelid) as size_bytes
  FROM pg_indexes 
  WHERE schemaname = 'public'
)
SELECT 
  tablename,
  string_agg(indexname, ', ') as potentially_redundant_indexes,
  columns,
  COUNT(*) as index_count,
  pg_size_pretty(SUM(size_bytes)) as total_wasted_space
FROM index_details
GROUP BY tablename, columns
HAVING COUNT(*) > 1
ORDER BY SUM(size_bytes) DESC;

-- ============================================================================
-- 5.2 QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Monitor slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  substring(query, 1, 100) || '...' as query_sample,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time,
  ROUND((100.0 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) AS percent_total
FROM pg_stat_statements 
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%information_schema%'
ORDER BY mean_exec_time DESC 
LIMIT 20;

-- Monitor queries affecting our main tables
CREATE OR REPLACE VIEW v_table_query_stats AS
SELECT 
  substring(query, 1, 150) || '...' as query_sample,
  calls,
  mean_exec_time,
  rows as avg_rows_returned,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE (query ILIKE '%maintenance_orders%' OR query ILIKE '%building_orders%')
  AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC 
LIMIT 15;

-- ============================================================================
-- 5.3 TABLE STATISTICS AND HEALTH MONITORING
-- ============================================================================

-- Monitor table sizes and growth
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
  schemaname,
  relname as tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as "Total Size",
  pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as "Table Size",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as "Index Size",
  n_live_tup as "Live Rows",
  n_dead_tup as "Dead Rows",
  CASE 
    WHEN n_live_tup > 0 
    THEN ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2) 
    ELSE 0 
  END as "Dead Row Percentage"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- Monitor table activity (inserts, updates, deletes)
CREATE OR REPLACE VIEW v_table_activity AS
SELECT 
  schemaname,
  relname as tablename,
  n_tup_ins as "Inserts",
  n_tup_upd as "Updates", 
  n_tup_del as "Deletes",
  n_tup_hot_upd as "HOT Updates",
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
  AND relname IN ('maintenance_orders', 'building_orders', 'companies', 'users')
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- ============================================================================
-- 5.4 MAINTENANCE PROCEDURES
-- ============================================================================

-- Procedure to update all table statistics
CREATE OR REPLACE FUNCTION refresh_all_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE companies;
  ANALYZE users;
  ANALYZE user_invitations;
  ANALYZE maintenance_orders;
  ANALYZE building_orders;
  
  RAISE NOTICE 'Statistics updated for all tables at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Procedure to vacuum and analyze tables when dead tuple percentage is high
CREATE OR REPLACE FUNCTION maintenance_vacuum_analyze()
RETURNS text AS $$
DECLARE
  rec RECORD;
  result text := '';
BEGIN
  FOR rec IN 
    SELECT 
      schemaname,
      relname as tablename,
      n_live_tup,
      n_dead_tup,
      CASE 
        WHEN n_live_tup > 0 
        THEN (n_dead_tup::float / n_live_tup::float) * 100
        ELSE 0 
      END as dead_percentage
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
      AND relname IN ('maintenance_orders', 'building_orders', 'companies', 'users')
      AND n_live_tup > 1000  -- Only for tables with significant data
  LOOP
    IF rec.dead_percentage > 10 THEN
      EXECUTE format('VACUUM ANALYZE %I.%I', rec.schemaname, rec.tablename);
      result := result || format('Vacuumed %s.%s (%.2f%% dead tuples)', 
                                rec.schemaname, rec.tablename, rec.dead_percentage) || E'\n';
    END IF;
  END LOOP;
  
  IF result = '' THEN
    result := 'No tables required vacuuming';
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5.5 PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test multi-tenant query performance
CREATE OR REPLACE FUNCTION test_multitenant_performance(p_company_id UUID)
RETURNS TABLE (
  query_description TEXT,
  execution_time_ms NUMERIC,
  rows_returned BIGINT
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  row_count BIGINT;
BEGIN
  -- Test 1: Basic company filtering
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_count FROM maintenance_orders WHERE company_id = p_company_id;
  end_time := clock_timestamp();
  
  query_description := 'Basic company filtering';
  execution_time_ms := EXTRACT(milliseconds FROM (end_time - start_time));
  rows_returned := row_count;
  RETURN NEXT;
  
  -- Test 2: Company + date range filtering
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_count 
  FROM maintenance_orders 
  WHERE company_id = p_company_id 
    AND abertura >= CURRENT_DATE - INTERVAL '30 days';
  end_time := clock_timestamp();
  
  query_description := 'Company + date range (30 days)';
  execution_time_ms := EXTRACT(milliseconds FROM (end_time - start_time));
  rows_returned := row_count;
  RETURN NEXT;
  
  -- Test 3: Company + status filtering
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_count 
  FROM maintenance_orders 
  WHERE company_id = p_company_id 
    AND situacao IS NOT NULL;
  end_time := clock_timestamp();
  
  query_description := 'Company + status filtering';
  execution_time_ms := EXTRACT(milliseconds FROM (end_time - start_time));
  rows_returned := row_count;
  RETURN NEXT;
  
  -- Test 4: Complex dashboard query
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_count 
  FROM maintenance_orders 
  WHERE company_id = p_company_id 
    AND abertura >= CURRENT_DATE - INTERVAL '90 days'
    AND prioridade IS NOT NULL
    AND equipamento IS NOT NULL;
  end_time := clock_timestamp();
  
  query_description := 'Complex dashboard filter';
  execution_time_ms := EXTRACT(milliseconds FROM (end_time - start_time));
  rows_returned := row_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5.6 REGULAR MAINTENANCE SCHEDULE
-- ============================================================================

-- Daily maintenance check (run this daily)
CREATE OR REPLACE FUNCTION daily_maintenance_check()
RETURNS text AS $$
DECLARE
  result text := E'=== DAILY MAINTENANCE CHECK ===\n';
  rec RECORD;
BEGIN
  result := result || 'Timestamp: ' || NOW() || E'\n\n';
  
  -- Check table sizes
  result := result || E'TABLE SIZES:\n';
  FOR rec IN 
    SELECT relname as tablename, pg_size_pretty(pg_total_relation_size('public.'||relname)) as size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
      AND relname IN ('maintenance_orders', 'building_orders', 'companies', 'users')
  LOOP
    result := result || format('  %s: %s', rec.tablename, rec.size) || E'\n';
  END LOOP;
  
  -- Check for unused indexes
  result := result || E'\nUNUSED INDEXES:\n';
  FOR rec IN 
    SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public' 
      AND idx_scan = 0 
      AND indexname NOT LIKE '%_pkey'
    LIMIT 5
  LOOP
    result := result || format('  %s: %s (never used)', rec.indexname, rec.size) || E'\n';
  END LOOP;
  
  -- Update statistics
  PERFORM refresh_all_statistics();
  result := result || E'\nTable statistics refreshed.\n';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- View index usage statistics
-- SELECT * FROM v_index_usage_stats WHERE tablename IN ('maintenance_orders', 'building_orders');

-- View unused indexes
-- SELECT * FROM v_unused_indexes;

-- View slow queries
-- SELECT * FROM v_slow_queries;

-- View table sizes and health
-- SELECT * FROM v_table_sizes;

-- Run daily maintenance check
-- SELECT daily_maintenance_check();

-- Test performance for a specific company
-- SELECT * FROM test_multitenant_performance('your-company-uuid-here');

-- Manual vacuum if needed
-- SELECT maintenance_vacuum_analyze();