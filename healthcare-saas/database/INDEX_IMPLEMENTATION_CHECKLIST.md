# Database Index Implementation Checklist

## Pre-Implementation Requirements

### ✅ Preparation Checklist
- [ ] **Backup Database**: Create full backup before starting
- [ ] **Monitor Current Performance**: Record baseline query times
- [ ] **Check Disk Space**: Ensure sufficient space (indexes will add 20-40% to database size)
- [ ] **Schedule Maintenance Window**: Plan for low-traffic periods
- [ ] **Enable pg_stat_statements**: For query performance monitoring

```sql
-- Enable pg_stat_statements if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### ✅ Environment Setup
- [ ] **Access Supabase SQL Editor**: Ensure admin access
- [ ] **Test Connection**: Verify database connectivity
- [ ] **Check Current Index Status**: Run baseline queries

## Implementation Schedule

### 🔴 PHASE 1: Critical Multi-Tenant Indexes (MANDATORY)
**File**: `01_critical_indexes.sql`
**Priority**: IMMEDIATE
**Expected Impact**: 50-90% improvement on multi-tenant queries

- [ ] Execute company_id + date indexes for maintenance_orders
- [ ] Execute company_id + status indexes for maintenance_orders  
- [ ] Execute company_id + date indexes for building_orders
- [ ] Execute company_id + status indexes for building_orders
- [ ] Execute user authentication optimization indexes
- [ ] **Verify**: Test multi-tenant filtering performance
- [ ] **Monitor**: Check index usage stats after 24h

**Estimated Time**: 30-60 minutes (depending on data size)

### 🟡 PHASE 2: Dashboard Query Optimization (HIGH PRIORITY)
**File**: `02_dashboard_indexes.sql`
**Priority**: HIGH
**Expected Impact**: 40-80% improvement on dashboard queries

- [ ] Execute date-range optimization indexes
- [ ] Execute priority/type filtering indexes
- [ ] Execute equipment/asset optimization indexes
- [ ] **Verify**: Test dashboard query performance
- [ ] **Monitor**: Check improved response times

**Estimated Time**: 45-90 minutes

### 🟢 PHASE 3: Advanced Analytics (MEDIUM PRIORITY)
**File**: `03_analytics_indexes.sql`
**Priority**: MEDIUM
**Expected Impact**: 50-75% improvement on analytics queries

- [ ] Execute cost analysis indexes
- [ ] Execute equipment family/category indexes
- [ ] Execute service/supplier analysis indexes
- [ ] Execute downtime analysis indexes
- [ ] **Verify**: Test analytics query performance

**Estimated Time**: 30-60 minutes

### 🔵 PHASE 4: Full-Text Search (OPTIONAL)
**File**: `04_search_indexes.sql`
**Priority**: OPTIONAL
**Expected Impact**: Enable advanced search capabilities

- [ ] **Decision**: Determine if search features are needed
- [ ] Execute equipment search indexes (if needed)
- [ ] Execute incident description indexes (if needed)
- [ ] Execute asset identification indexes (if needed)
- [ ] **Verify**: Test search functionality

**Estimated Time**: 20-40 minutes

### 🟣 PHASE 5: Monitoring Setup (ONGOING)
**File**: `05_monitoring_maintenance.sql`
**Priority**: MAINTENANCE
**Expected Impact**: Ongoing performance optimization

- [ ] Create monitoring views
- [ ] Set up performance testing functions
- [ ] Schedule regular maintenance procedures
- [ ] Create automated monitoring alerts

## Execution Commands for Supabase SQL Editor

### Step 1: Pre-Implementation Check
```sql
-- Check current database statistics
SELECT 
  schemaname,
  tablename,
  n_live_tup as "Live Rows",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Size"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 2: Execute Each Phase
Copy and paste the contents of each SQL file into Supabase SQL Editor and execute:

1. **Phase 1**: Copy `01_critical_indexes.sql` → Execute
2. **Phase 2**: Copy `02_dashboard_indexes.sql` → Execute  
3. **Phase 3**: Copy `03_analytics_indexes.sql` → Execute
4. **Phase 4**: Copy `04_search_indexes.sql` → Execute (optional)
5. **Phase 5**: Copy `05_monitoring_maintenance.sql` → Execute

### Step 3: Post-Implementation Verification
```sql
-- Verify all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## Performance Testing

### Before Implementation - Record Baseline
```sql
-- Record baseline performance
\timing on

-- Test 1: Basic company query
SELECT COUNT(*) FROM maintenance_orders WHERE company_id = 'your-uuid';

-- Test 2: Date range query  
SELECT COUNT(*) FROM maintenance_orders 
WHERE company_id = 'your-uuid' 
AND abertura >= '2024-01-01';

-- Test 3: Dashboard aggregation
SELECT prioridade, COUNT(*) 
FROM maintenance_orders 
WHERE company_id = 'your-uuid' 
GROUP BY prioridade;
```

### After Implementation - Compare Performance
Run the same queries and compare execution times.

## Monitoring Schedule

### Daily (Automated)
- [ ] Run `SELECT daily_maintenance_check();`
- [ ] Monitor index usage: `SELECT * FROM v_index_usage_stats;`
- [ ] Check for slow queries: `SELECT * FROM v_slow_queries;`

### Weekly
- [ ] Review unused indexes: `SELECT * FROM v_unused_indexes;`
- [ ] Update table statistics: `SELECT refresh_all_statistics();`
- [ ] Check table sizes: `SELECT * FROM v_table_sizes;`

### Monthly
- [ ] Performance review and optimization
- [ ] Remove unused indexes if confirmed unnecessary
- [ ] Plan for additional indexes based on new query patterns

## Troubleshooting

### If Index Creation Fails
```sql
-- Check if index already exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'maintenance_orders' 
AND indexname = 'your-index-name';

-- Check for blocking locks
SELECT * FROM pg_locks WHERE granted = false;
```

### If Performance Doesn't Improve
```sql
-- Force query planner to use new indexes
ANALYZE maintenance_orders;
ANALYZE building_orders;

-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM maintenance_orders 
WHERE company_id = 'your-uuid' 
AND abertura >= '2024-01-01';
```

### Rollback Plan
```sql
-- Drop specific indexes if needed
DROP INDEX CONCURRENTLY IF EXISTS idx_maintenance_orders_company_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_maintenance_orders_company_status;
-- Add other indexes to drop as needed
```

## Success Criteria

### ✅ Phase 1 Success Indicators
- [ ] Multi-tenant queries execute in <100ms
- [ ] Company filtering uses appropriate indexes
- [ ] No full table scans on large tables

### ✅ Phase 2 Success Indicators  
- [ ] Dashboard loads in <2 seconds
- [ ] Date range queries execute in <200ms
- [ ] Equipment filtering is responsive

### ✅ Overall Success Indicators
- [ ] 50%+ improvement in query response times
- [ ] Reduced database CPU usage
- [ ] Improved user experience in dashboards
- [ ] No significant increase in storage costs

## Emergency Contacts

**Database Issues**: Escalate to database administrator
**Application Issues**: Contact development team  
**Performance Issues**: Review monitoring dashboard

## Final Notes

1. **Index Maintenance**: Indexes require ongoing maintenance
2. **Monitor Usage**: Remove unused indexes to save space
3. **Query Optimization**: Indexes work best with well-written queries
4. **Regular Reviews**: Performance needs change over time

Remember: The goal is improved performance, not just more indexes!