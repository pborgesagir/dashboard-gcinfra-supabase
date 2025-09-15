-- Create company_id + date index for maintenance_orders
-- This index optimizes multi-tenant queries with date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_date 
ON maintenance_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;