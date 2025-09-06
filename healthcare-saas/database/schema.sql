-- Healthcare Infrastructure SaaS Database Schema
-- This file contains the complete database schema for multi-tenancy

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');

-- Companies table (tenants)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL-friendly identifier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Users table with multi-tenant support
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'manager',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL for admins
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT role_company_constraint CHECK (
    (role = 'admin' AND company_id IS NULL) OR 
    (role = 'manager' AND company_id IS NOT NULL)
  )
);

-- User invitations table
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'manager',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status invite_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT invitation_role_company_constraint CHECK (
    (role = 'admin' AND company_id IS NULL) OR 
    (role = 'manager' AND company_id IS NOT NULL)
  )
);

-- Update the existing maintenance_orders table to support multi-tenancy
ALTER TABLE maintenance_orders 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Update the existing building_orders table to support multi-tenancy  
ALTER TABLE building_orders 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_maintenance_orders_company_id ON maintenance_orders(company_id);
CREATE INDEX idx_building_orders_company_id ON building_orders(company_id);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();