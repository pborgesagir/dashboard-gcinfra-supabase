# Supabase Database Indexing Strategy for Healthcare SaaS

## Overview
This document provides a comprehensive step-by-step guide to implement an optimal indexing strategy for the GCINFRA 360º healthcare SaaS platform's Supabase database to handle massive data volumes efficiently.

## Current Database Analysis

### Main Tables with High Volume:
1. **maintenance_orders** - Primary clinical maintenance data (likely millions of rows)
2. **building_orders** - Infrastructure maintenance data (likely millions of rows)
3. **companies** - Multi-tenant organizations (hundreds to thousands)
4. **users** - Platform users (thousands)
5. **user_invitations** - Invitation management (moderate volume)

### Identified Performance Bottlenecks:
1. **Multi-tenant filtering** - `company_id` queries across large tables
2. **Date range queries** - Dashboard filtering by dates
3. **Status/priority filtering** - Common dashboard filters
4. **Equipment/asset lookups** - Tag, patrimonio, equipamento searches
5. **Full-text searches** - Equipment names, descriptions
6. **Aggregation queries** - KPI calculations and reporting

## Step-by-Step Implementation Guide

### Phase 1: Critical Multi-Tenant Indexes (IMMEDIATE PRIORITY)

These indexes are essential for multi-tenant data isolation and should be implemented first:

#### 1.1 Company-based Partition Indexes
```sql
-- Execute in Supabase SQL Editor
-- These are the most critical indexes for multi-tenant performance

-- Enhanced company_id indexes with commonly filtered columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_date 
ON maintenance_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_status 
ON maintenance_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_date 
ON building_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_status 
ON building_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;
```

#### 1.2 User Access Optimization
```sql
-- Optimize user authentication and authorization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_role 
ON users(company_id, role) 
WHERE is_active = true;
```

### Phase 2: Dashboard Query Optimization (HIGH PRIORITY)

These indexes optimize the most common dashboard queries:

#### 2.1 Date-Range Query Optimization
```sql
-- Critical for dashboard date filtering and trend analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_date_range 
ON maintenance_orders(company_id, abertura, fechamento) 
WHERE company_id IS NOT NULL AND abertura IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_status_date 
ON maintenance_orders(company_id, situacao, abertura) 
WHERE company_id IS NOT NULL AND situacao IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_date_range 
ON building_orders(company_id, abertura, fechamento) 
WHERE company_id IS NOT NULL AND abertura IS NOT NULL;
```

#### 2.2 Priority and Type Filtering
```sql
-- Optimize priority and maintenance type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_priority 
ON maintenance_orders(company_id, prioridade, abertura) 
WHERE company_id IS NOT NULL AND prioridade IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_type 
ON maintenance_orders(company_id, tipomanutencao, abertura) 
WHERE company_id IS NOT NULL AND tipomanutencao IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_complexity 
ON maintenance_orders(company_id, complexidade, abertura) 
WHERE company_id IS NOT NULL AND complexidade IS NOT NULL;
```

#### 2.3 Equipment and Asset Optimization
```sql
-- Optimize equipment-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_equipment 
ON maintenance_orders(company_id, equipamento) 
WHERE company_id IS NOT NULL AND equipamento IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_tag 
ON maintenance_orders(company_id, tag) 
WHERE company_id IS NOT NULL AND tag IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_patrimonio 
ON maintenance_orders(company_id, patrimonio) 
WHERE company_id IS NOT NULL AND patrimonio IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_setor 
ON maintenance_orders(company_id, setor) 
WHERE company_id IS NOT NULL AND setor IS NOT NULL;
```

### Phase 3: Advanced Analytics Optimization (MEDIUM PRIORITY)

#### 3.1 Cost Analysis Indexes
```sql
-- Optimize cost-related queries for financial dashboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_costs 
ON maintenance_orders(company_id, abertura) 
INCLUDE (custo_os, custo_mo, custo_peca, custo_servicoexterno) 
WHERE company_id IS NOT NULL AND custo_os IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_costs 
ON building_orders(company_id, abertura) 
INCLUDE (custo_os, custo_mo, custo_peca, custo_servicoexterno) 
WHERE company_id IS NOT NULL AND custo_os IS NOT NULL;
```

#### 3.2 Equipment Family and Category Analysis
```sql
-- Optimize equipment categorization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_familia 
ON maintenance_orders(company_id, familia, abertura) 
WHERE company_id IS NOT NULL AND familia IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_fabricante 
ON maintenance_orders(company_id, fabricante) 
WHERE company_id IS NOT NULL AND fabricante IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_causa 
ON maintenance_orders(company_id, causa, abertura) 
WHERE company_id IS NOT NULL AND causa IS NOT NULL;
```

### Phase 4: Full-Text Search Optimization (OPTIONAL)

#### 4.1 Equipment Search Optimization
```sql
-- Create GIN indexes for full-text search capabilities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_equipment_fts 
ON maintenance_orders USING gin(to_tsvector('portuguese', 
  COALESCE(equipamento, '') || ' ' || 
  COALESCE(fabricante, '') || ' ' || 
  COALESCE(modelo, '')
)) 
WHERE company_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_description_fts 
ON maintenance_orders USING gin(to_tsvector('portuguese', 
  COALESCE(ocorrencia, '') || ' ' || 
  COALESCE(servico, '')
)) 
WHERE company_id IS NOT NULL;
```

### Phase 5: Invitation System Optimization (LOW PRIORITY)

```sql
-- Optimize invitation management queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_invitations_company_status 
ON user_invitations(company_id, status, expires_at) 
WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_invitations_expires 
ON user_invitations(expires_at) 
WHERE status = 'pending';
```

## Implementation Steps

### Step 1: Preparation (Before Implementation)

1. **Backup Database**: Always create a backup before major changes
```sql
-- Run in Supabase SQL Editor to check current database size
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN ('maintenance_orders', 'building_orders')
ORDER BY tablename, attname;
```

2. **Check Current Indexes**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

3. **Monitor Current Performance**:
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%maintenance_orders%' 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Step 2: Execute Index Creation

1. **Execute Phase 1** (Critical indexes) - Run during low traffic
2. **Monitor Impact** - Check query performance improvement
3. **Execute Phase 2** (Dashboard optimization) - Run progressively
4. **Continue with remaining phases** based on performance needs

### Step 3: Post-Implementation Monitoring

#### 3.1 Index Usage Monitoring
```sql
-- Monitor index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND tablename IN ('maintenance_orders', 'building_orders')
ORDER BY idx_scan DESC;
```

#### 3.2 Query Performance Monitoring
```sql
-- Monitor query performance improvements
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time
FROM pg_stat_statements 
WHERE query ILIKE '%maintenance_orders%' 
OR query ILIKE '%building_orders%'
ORDER BY mean_exec_time DESC;
```

## Performance Testing Queries

### Test Multi-Tenant Filtering Performance:
```sql
-- Test company-specific queries (should use idx_maintenance_orders_company_date)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM maintenance_orders 
WHERE company_id = 'your-company-uuid' 
AND abertura >= '2024-01-01' 
AND abertura <= '2024-12-31';
```

### Test Dashboard Queries:
```sql
-- Test priority filtering (should use idx_maintenance_orders_priority)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT prioridade, COUNT(*) 
FROM maintenance_orders 
WHERE company_id = 'your-company-uuid' 
AND abertura >= '2024-01-01' 
GROUP BY prioridade;
```

### Test Equipment Queries:
```sql
-- Test equipment filtering (should use idx_maintenance_orders_equipment)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * 
FROM maintenance_orders 
WHERE company_id = 'your-company-uuid' 
AND equipamento ILIKE '%bomba%' 
LIMIT 50;
```

## Index Maintenance

### Regular Maintenance Tasks:

1. **Weekly Index Statistics Update**:
```sql
-- Update statistics for better query planning
ANALYZE maintenance_orders;
ANALYZE building_orders;
ANALYZE companies;
ANALYZE users;
```

2. **Monthly Index Health Check**:
```sql
-- Check for bloated indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

3. **Quarterly Index Review**:
```sql
-- Identify unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Expected Performance Improvements

1. **Multi-tenant queries**: 50-90% improvement
2. **Dashboard date filtering**: 60-80% improvement
3. **Equipment searches**: 70-85% improvement
4. **Priority/status filtering**: 40-70% improvement
5. **Cost analysis queries**: 50-75% improvement

## Important Notes

1. **Use CONCURRENTLY**: All CREATE INDEX commands use CONCURRENTLY to avoid locking tables
2. **Monitor Disk Space**: Indexes will increase database size by 20-40%
3. **Implement Gradually**: Roll out in phases to monitor impact
4. **Test Thoroughly**: Always test on staging environment first
5. **Schedule During Low Traffic**: Create indexes during maintenance windows when possible

## Rollback Plan

If performance degrades after index creation:

```sql
-- Remove specific indexes if needed
DROP INDEX CONCURRENTLY IF EXISTS idx_maintenance_orders_company_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_maintenance_orders_company_status;
-- Continue for other indexes as needed
```

## Next Steps

1. Review current query patterns in your application
2. Implement Phase 1 indexes first
3. Monitor performance improvements
4. Gradually implement remaining phases
5. Set up regular monitoring and maintenance procedures