-- CORRECTED: Verify Phase 1 Success - Check index sizes and usage
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size",
  idx_scan as "Times Used"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND indexrelname LIKE 'idx_%'
AND (
  indexrelname LIKE '%company_date%' OR
  indexrelname LIKE '%company_status%' OR
  indexrelname LIKE '%email_active%' OR
  indexrelname LIKE '%company_role%'
)
ORDER BY relname, indexrelname;