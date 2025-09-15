-- Create company_id + status index for building_orders
-- This index optimizes multi-tenant queries with status filtering for building orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_status 
ON building_orders(company_id, situacao) 
WHERE company_id IS NOT NULL;