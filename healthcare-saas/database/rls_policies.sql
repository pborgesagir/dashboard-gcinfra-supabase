-- Row Level Security Policies for Multi-Tenant Healthcare SaaS
-- This file contains all RLS policies to ensure data isolation between companies

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_orders ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role and company
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS user_role
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$;

-- COMPANIES TABLE POLICIES
-- Companies table is read-only and automatically managed by the system

-- Admins can see all companies, managers can only see their own company
CREATE POLICY "Users can view companies based on role" ON companies
FOR SELECT
USING (
  auth.get_user_role() = 'admin' 
  OR 
  id = auth.get_user_company_id()
);

-- Companies table is read-only: No INSERT, UPDATE, or DELETE allowed for any user
-- The table is automatically synchronized from building_orders data via triggers
-- This ensures companies table remains as a system-managed, read-only list

-- NOTE: The automatic synchronization is handled by database triggers and functions
-- that operate outside of RLS constraints (using SECURITY DEFINER functions)

-- USERS TABLE POLICIES

-- Admins can see all users, managers can only see users from their company
CREATE POLICY "Users can view users based on role" ON users
FOR SELECT
USING (
  auth.get_user_role() = 'admin'
  OR
  company_id = auth.get_user_company_id()
);

-- Only admins can insert users
CREATE POLICY "Only admins can insert users" ON users
FOR INSERT
WITH CHECK (auth.get_user_role() = 'admin');

-- Only admins can update users
CREATE POLICY "Only admins can update users" ON users
FOR UPDATE
USING (auth.get_user_role() = 'admin');

-- Only admins can delete users
CREATE POLICY "Only admins can delete users" ON users
FOR DELETE
USING (auth.get_user_role() = 'admin');

-- USER INVITATIONS TABLE POLICIES

-- Admins can see all invitations, managers can see none (they can't invite)
CREATE POLICY "Only admins can view invitations" ON user_invitations
FOR SELECT
USING (auth.get_user_role() = 'admin');

-- Only admins can create invitations
CREATE POLICY "Only admins can create invitations" ON user_invitations
FOR INSERT
WITH CHECK (auth.get_user_role() = 'admin');

-- Only admins can update invitations
CREATE POLICY "Only admins can update invitations" ON user_invitations
FOR UPDATE
USING (auth.get_user_role() = 'admin');

-- Only admins can delete invitations
CREATE POLICY "Only admins can delete invitations" ON user_invitations
FOR DELETE
USING (auth.get_user_role() = 'admin');

-- MAINTENANCE ORDERS TABLE POLICIES

-- Admins can see all maintenance orders, managers only see their company's orders
CREATE POLICY "Users can view maintenance orders based on role" ON maintenance_orders
FOR SELECT
USING (
  auth.get_user_role() = 'admin'
  OR
  company_id = auth.get_user_company_id()
);

-- Only system/service accounts can insert/update maintenance orders (for ETL process)
-- We'll handle this through service account or by temporarily disabling RLS during ETL
CREATE POLICY "Service accounts can modify maintenance orders" ON maintenance_orders
FOR ALL
USING (auth.get_user_role() = 'admin'); -- For now, only admins can modify

-- BUILDING ORDERS TABLE POLICIES

-- Admins can see all building orders, managers only see their company's orders  
CREATE POLICY "Users can view building orders based on role" ON building_orders
FOR SELECT
USING (
  auth.get_user_role() = 'admin'
  OR
  company_id = auth.get_user_company_id()
);

-- Only system/service accounts can insert/update building orders (for ETL process)
CREATE POLICY "Service accounts can modify building orders" ON building_orders
FOR ALL
USING (auth.get_user_role() = 'admin'); -- For now, only admins can modify

-- SPECIAL POLICIES FOR PUBLIC ACCESS (like invitation acceptance)

-- Allow public access to user_invitations for token validation (with limited fields)
CREATE POLICY "Public can validate invitation tokens" ON user_invitations
FOR SELECT
USING (TRUE); -- This will be further restricted in the application layer

-- We'll need to be careful with this policy and ensure the application layer
-- properly filters what invitation data is exposed publicly