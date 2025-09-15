-- Check current database statistics before creating indexes
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