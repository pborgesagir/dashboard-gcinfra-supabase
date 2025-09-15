-- Get a real company UUID from your database to test performance
SELECT 
  id as company_uuid,
  name as company_name,
  acronym
FROM companies 
WHERE is_active = true
ORDER BY name
LIMIT 5;