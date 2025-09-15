-- Create company_id + date index for building_orders
-- This index optimizes multi-tenant queries with date filtering for building orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_company_date 
ON building_orders(company_id, abertura) 
WHERE company_id IS NOT NULL;