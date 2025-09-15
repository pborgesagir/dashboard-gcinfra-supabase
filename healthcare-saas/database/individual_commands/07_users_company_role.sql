-- Create company_id + role index for users
-- This index optimizes user authorization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_role 
ON users(company_id, role) 
WHERE is_active = true;