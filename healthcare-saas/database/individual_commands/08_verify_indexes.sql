-- Verify that all critical indexes were created successfully
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