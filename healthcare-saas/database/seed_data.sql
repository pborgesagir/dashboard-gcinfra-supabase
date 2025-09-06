-- Sample data for development and testing

-- Insert sample companies
INSERT INTO companies (id, name, slug) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Hospital São Lucas', 'hospital-sao-lucas'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Clínica Vida Nova', 'clinica-vida-nova'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Centro Médico Excellence', 'centro-medico-excellence');

-- Insert sample admin user (this would normally be created through Supabase Auth)
-- Note: In production, user IDs come from Supabase Auth
INSERT INTO users (id, email, role, company_id) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'admin@healthcare-saas.com', 'admin', NULL);

-- Insert sample manager users
INSERT INTO users (id, email, role, company_id) VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'manager1@hospitalsaolucas.com', 'manager', '550e8400-e29b-41d4-a716-446655440000'),
  ('123e4567-e89b-12d3-a456-426614174002', 'manager2@clinicavidanova.com', 'manager', '550e8400-e29b-41d4-a716-446655440001'),
  ('123e4567-e89b-12d3-a456-426614174003', 'manager3@centromedico.com', 'manager', '550e8400-e29b-41d4-a716-446655440002');

-- Note: maintenance_orders and building_orders will have their company_id updated
-- by the ETL process based on the empresa field mapping
-- For now, we can update existing records to map to our sample companies

-- Example: Update existing maintenance orders to map to companies
-- This is just an example - in production you'd need proper mapping logic
-- UPDATE maintenance_orders 
-- SET company_id = (
--   CASE 
--     WHEN empresa = 'Hospital São Lucas' THEN '550e8400-e29b-41d4-a716-446655440000'
--     WHEN empresa = 'Clínica Vida Nova' THEN '550e8400-e29b-41d4-a716-446655440001'
--     WHEN empresa = 'Centro Médico Excellence' THEN '550e8400-e29b-41d4-a716-446655440002'
--     ELSE '550e8400-e29b-41d4-a716-446655440000' -- Default to first company
--   END
-- ) 
-- WHERE company_id IS NULL;

-- Example: Update existing building orders to map to companies  
-- UPDATE building_orders 
-- SET company_id = (
--   CASE 
--     WHEN empresa = 'Hospital São Lucas' THEN '550e8400-e29b-41d4-a716-446655440000'
--     WHEN empresa = 'Clínica Vida Nova' THEN '550e8400-e29b-41d4-a716-446655440001'
--     WHEN empresa = 'Centro Médico Excellence' THEN '550e8400-e29b-41d4-a716-446655440002'
--     ELSE '550e8400-e29b-41d4-a716-446655440000' -- Default to first company
--   END
-- ) 
-- WHERE company_id IS NULL;