-- Migration script to replace slug column with acronym column in companies table
-- The acronym values will be populated from the empresa column in building_orders table

BEGIN;

-- Step 1: Add the new acronym column
ALTER TABLE companies 
ADD COLUMN acronym VARCHAR(50);

-- Step 2: Populate acronym column with distinct empresa values from building_orders
-- This creates a mapping between existing companies and their acronyms
UPDATE companies 
SET acronym = (
    SELECT DISTINCT bo.empresa 
    FROM building_orders bo 
    WHERE bo.empresa IS NOT NULL 
    AND companies.name = COALESCE(bo.razaosocial, bo.empresa)
    LIMIT 1
);

-- Step 3: For companies without a match, use the first 10 characters of company name as acronym
UPDATE companies 
SET acronym = UPPER(LEFT(REPLACE(name, ' ', ''), 10))
WHERE acronym IS NULL;

-- Step 4: Ensure acronym uniqueness by adding numbers to duplicates
WITH numbered_acronyms AS (
    SELECT id, acronym, 
           ROW_NUMBER() OVER (PARTITION BY acronym ORDER BY created_at) as rn
    FROM companies
)
UPDATE companies 
SET acronym = CASE 
    WHEN na.rn = 1 THEN na.acronym
    ELSE na.acronym || na.rn::text
END
FROM numbered_acronyms na
WHERE companies.id = na.id AND na.rn > 1;

-- Step 5: Make acronym column NOT NULL and add unique constraint
ALTER TABLE companies 
ALTER COLUMN acronym SET NOT NULL,
ADD CONSTRAINT companies_acronym_unique UNIQUE (acronym);

-- Step 6: Drop the old slug column and its associated index
DROP INDEX IF EXISTS idx_companies_slug;
ALTER TABLE companies DROP COLUMN slug;

-- Step 7: Create new index for acronym column
CREATE INDEX idx_companies_acronym ON companies(acronym);

-- Step 8: Update the generate_company_slug function to generate_company_acronym
DROP FUNCTION IF EXISTS generate_company_slug(TEXT);

CREATE OR REPLACE FUNCTION generate_company_acronym(company_name TEXT, empresa_value TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_acronym TEXT;
    final_acronym TEXT;
    counter INTEGER := 1;
BEGIN
    -- Use empresa value if provided, otherwise generate from company name
    IF empresa_value IS NOT NULL AND LENGTH(empresa_value) > 0 THEN
        base_acronym := UPPER(empresa_value);
    ELSE
        -- Generate acronym from company name: uppercase, remove spaces, limit to 10 chars
        base_acronym := UPPER(LEFT(REPLACE(company_name, ' ', ''), 10));
    END IF;
    
    -- Remove any non-alphanumeric characters
    base_acronym := regexp_replace(base_acronym, '[^A-Z0-9]', '', 'g');
    
    -- Ensure acronym is not empty
    IF LENGTH(base_acronym) = 0 THEN
        base_acronym := 'COMP';
    END IF;
    
    -- Ensure acronym is unique
    final_acronym := base_acronym;
    WHILE EXISTS (SELECT 1 FROM companies WHERE acronym = final_acronym) LOOP
        final_acronym := base_acronym || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_acronym;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update the sync_companies_from_building_orders function
CREATE OR REPLACE FUNCTION sync_companies_from_building_orders()
RETURNS VOID AS $$
DECLARE
    company_record RECORD;
    new_acronym TEXT;
BEGIN
    -- Insert new companies that don't exist yet
    FOR company_record IN
        SELECT DISTINCT 
            empresa,
            razaosocial
        FROM building_orders 
        WHERE empresa IS NOT NULL 
        AND empresa NOT IN (
            SELECT acronym FROM companies WHERE acronym IS NOT NULL
        )
    LOOP
        -- Generate unique acronym
        new_acronym := generate_company_acronym(
            COALESCE(company_record.razaosocial, company_record.empresa),
            company_record.empresa
        );
        
        -- Insert new company
        INSERT INTO companies (name, acronym, created_at, updated_at, is_active)
        VALUES (
            COALESCE(company_record.razaosocial, company_record.empresa),
            new_acronym,
            NOW(),
            NOW(),
            TRUE
        );
        
        RAISE NOTICE 'Created new company: % with acronym: %', 
            COALESCE(company_record.razaosocial, company_record.empresa), 
            new_acronym;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update the trigger function to work with acronym
CREATE OR REPLACE FUNCTION trigger_sync_companies_from_building_orders()
RETURNS TRIGGER AS $$
DECLARE
    company_exists BOOLEAN;
    new_acronym TEXT;
BEGIN
    -- Check if this is a new empresa value
    IF NEW.empresa IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM companies WHERE acronym = NEW.empresa
        ) INTO company_exists;
        
        -- If company doesn't exist, create it
        IF NOT company_exists THEN
            new_acronym := generate_company_acronym(
                COALESCE(NEW.razaosocial, NEW.empresa),
                NEW.empresa
            );
            
            INSERT INTO companies (name, acronym, created_at, updated_at, is_active)
            VALUES (
                COALESCE(NEW.razaosocial, NEW.empresa),
                new_acronym,
                NOW(),
                NOW(),
                TRUE
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;