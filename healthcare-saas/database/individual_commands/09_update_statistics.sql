-- Update table statistics for better query planning
-- Run these commands to help PostgreSQL optimize queries with the new indexes
ANALYZE maintenance_orders;
ANALYZE building_orders;
ANALYZE users;