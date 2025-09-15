-- ============================================================================
-- CHECK ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- The error might be related to RLS policies blocking data access after index changes

-- Step 1: Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  rowsecurity_forced as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('maintenance_orders', 'building_orders', 'users', 'companies');

-- Step 2: Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('maintenance_orders', 'building_orders', 'users', 'companies')
ORDER BY tablename, policyname;

-- Step 3: Check if current user has proper permissions
SELECT 
  table_schema,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public'
AND table_name IN ('maintenance_orders', 'building_orders', 'users', 'companies')
AND grantee = current_user
ORDER BY table_name, privilege_type;

-- Step 4: Test bypassing RLS temporarily (if you have admin access)
-- WARNING: Only run this if you have admin rights and understand the security implications
-- SET row_security = off;
-- SELECT COUNT(*) FROM maintenance_orders;
-- SET row_security = on;

-- Step 5: Check if there are any foreign key constraint issues
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('maintenance_orders', 'building_orders')
AND tc.constraint_type = 'FOREIGN KEY';