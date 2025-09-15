-- Create optimized email index for active users
-- This index optimizes user authentication queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON users(email) 
WHERE is_active = true;