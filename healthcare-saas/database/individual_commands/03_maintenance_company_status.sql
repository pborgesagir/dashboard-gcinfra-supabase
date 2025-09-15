-- Create company_id + status index for maintenance_orders
-- This index optimizes multi-tenant queries with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_company_status 
ON maintenance_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;