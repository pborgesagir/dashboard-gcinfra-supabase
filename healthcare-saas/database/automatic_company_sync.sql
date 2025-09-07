-- Automatic Company Synchronization System
-- This script creates database functions and triggers to automatically synchronize
-- the companies table based on building_orders data.

-- Function to generate a URL-friendly slug from a company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug: lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(company_name);
    base_slug := replace(base_slug, ' ', '-');
    base_slug := replace(base_slug, 'ã', 'a');
    base_slug := replace(base_slug, 'ç', 'c');
    base_slug := replace(base_slug, 'á', 'a');
    base_slug := replace(base_slug, 'à', 'a');
    base_slug := replace(base_slug, 'â', 'a');
    base_slug := replace(base_slug, 'é', 'e');
    base_slug := replace(base_slug, 'ê', 'e');
    base_slug := replace(base_slug, 'í', 'i');
    base_slug := replace(base_slug, 'ó', 'o');
    base_slug := replace(base_slug, 'ô', 'o');
    base_slug := replace(base_slug, 'ú', 'u');
    base_slug := replace(base_slug, 'ü', 'u');
    -- Remove any non-alphanumeric characters except hyphens
    base_slug := regexp_replace(base_slug, '[^a-z0-9-]', '', 'g');
    -- Remove multiple consecutive hyphens
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    -- Remove leading/trailing hyphens
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure slug is unique
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically sync companies from building_orders
CREATE OR REPLACE FUNCTION sync_companies_from_building_orders()
RETURNS VOID AS $$
DECLARE
    company_record RECORD;
    new_slug TEXT;
BEGIN
    -- Insert new companies that don't exist yet
    FOR company_record IN (
        SELECT DISTINCT 
            empresa,
            razaosocial
        FROM building_orders 
        WHERE empresa IS NOT NULL 
        AND razaosocial IS NOT NULL
        AND empresa NOT IN (
            SELECT COALESCE(name, '') FROM companies WHERE name IS NOT NULL
        )
    ) LOOP
        -- Generate unique slug
        new_slug := generate_company_slug(company_record.razaosocial);
        
        -- Insert new company
        INSERT INTO companies (name, slug, is_active, created_at, updated_at)
        VALUES (
            company_record.razaosocial,
            new_slug,
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new company: % with slug: %', company_record.razaosocial, new_slug;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically sync companies when building_orders changes
CREATE OR REPLACE FUNCTION trigger_sync_companies()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the sync function
    PERFORM sync_companies_from_building_orders();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_sync_companies_trigger ON building_orders;

-- Create trigger on building_orders table
CREATE TRIGGER auto_sync_companies_trigger
    AFTER INSERT OR UPDATE OF empresa, razaosocial ON building_orders
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_sync_companies();

-- Initial synchronization: sync all existing building_orders data
SELECT sync_companies_from_building_orders();

-- Create a function to manually trigger synchronization if needed
CREATE OR REPLACE FUNCTION manual_sync_companies()
RETURNS TABLE(
    action TEXT,
    company_name TEXT,
    company_slug TEXT
) AS $$
DECLARE
    company_record RECORD;
    new_slug TEXT;
    companies_before INTEGER;
    companies_after INTEGER;
BEGIN
    -- Count companies before sync
    SELECT COUNT(*) INTO companies_before FROM companies;
    
    -- Sync companies
    FOR company_record IN (
        SELECT DISTINCT 
            bo.empresa,
            bo.razaosocial
        FROM building_orders bo
        WHERE bo.empresa IS NOT NULL 
        AND bo.razaosocial IS NOT NULL
        AND bo.empresa NOT IN (
            SELECT COALESCE(c.name, '') FROM companies c WHERE c.name IS NOT NULL
        )
    ) LOOP
        -- Generate unique slug
        new_slug := generate_company_slug(company_record.razaosocial);
        
        -- Insert new company
        INSERT INTO companies (name, slug, is_active, created_at, updated_at)
        VALUES (
            company_record.razaosocial,
            new_slug,
            true,
            NOW(),
            NOW()
        );
        
        -- Return information about created company
        RETURN QUERY SELECT 
            'created'::TEXT as action,
            company_record.razaosocial as company_name,
            new_slug as company_slug;
    END LOOP;
    
    -- Count companies after sync
    SELECT COUNT(*) INTO companies_after FROM companies;
    
    -- Return summary if no companies were created
    IF companies_before = companies_after THEN
        RETURN QUERY SELECT 
            'no_changes'::TEXT as action,
            'All companies are already synchronized'::TEXT as company_name,
            NULL::TEXT as company_slug;
    END IF;
END;
$$ LANGUAGE plpgsql;