-- ============================================================================
-- PHASE 4: FULL-TEXT SEARCH OPTIMIZATION INDEXES
-- ============================================================================
-- Execute these indexes ONLY IF you need full-text search capabilities
-- These are optional and should only be implemented if search features are used
-- ============================================================================

-- ============================================================================
-- 4.1 EQUIPMENT SEARCH OPTIMIZATION
-- ============================================================================

-- Full-text search for equipment information (Portuguese language)
-- Combines equipamento, fabricante, and modelo for comprehensive equipment search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_equipment_fts 
ON maintenance_orders USING gin(to_tsvector('portuguese', 
  COALESCE(equipamento, '') || ' ' || 
  COALESCE(fabricante, '') || ' ' || 
  COALESCE(modelo, '') || ' ' ||
  COALESCE(familia, '')
)) 
WHERE company_id IS NOT NULL;

-- Equipment description search for building orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_equipment_fts 
ON building_orders USING gin(to_tsvector('portuguese', 
  COALESCE(equipamento, '') || ' ' || 
  COALESCE(fabricante, '') || ' ' || 
  COALESCE(modelo, '')
)) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- 4.2 INCIDENT DESCRIPTION SEARCH
-- ============================================================================

-- Full-text search for problem descriptions and services
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_description_fts 
ON maintenance_orders USING gin(to_tsvector('portuguese', 
  COALESCE(ocorrencia, '') || ' ' || 
  COALESCE(servico, '') || ' ' ||
  COALESCE(obs_mo, '')
)) 
WHERE company_id IS NOT NULL;

-- Building orders description search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_description_fts 
ON building_orders USING gin(to_tsvector('portuguese', 
  COALESCE(ocorrencia, '') || ' ' || 
  COALESCE(servico, '') || ' ' ||
  COALESCE(obs_mo, '')
)) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- 4.3 ASSET IDENTIFICATION SEARCH
-- ============================================================================

-- Search by asset identifiers (tag, patrimonio, sn, tombamento)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_asset_search 
ON maintenance_orders USING gin(to_tsvector('simple', 
  COALESCE(tag, '') || ' ' || 
  COALESCE(patrimonio, '') || ' ' || 
  COALESCE(sn, '') || ' ' ||
  COALESCE(tombamento, '') || ' ' ||
  COALESCE(nserie, '')
)) 
WHERE company_id IS NOT NULL;

-- Asset search for building orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_asset_search 
ON building_orders USING gin(to_tsvector('simple', 
  COALESCE(tag, '') || ' ' || 
  COALESCE(patrimonio, '') || ' ' || 
  COALESCE(sn, '')
)) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- 4.4 LOCATION SEARCH
-- ============================================================================

-- Location-based search (setor, grupo_setor)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_orders_location_fts 
ON maintenance_orders USING gin(to_tsvector('portuguese', 
  COALESCE(setor, '') || ' ' || 
  COALESCE(grupo_setor, '')
)) 
WHERE company_id IS NOT NULL;

-- Building orders location search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_orders_location_fts 
ON building_orders USING gin(to_tsvector('portuguese', 
  COALESCE(setor, '') || ' ' || 
  COALESCE(grupo_setor, '')
)) 
WHERE company_id IS NOT NULL;

-- ============================================================================
-- SEARCH HELPER FUNCTIONS
-- ============================================================================

-- Create a function to search equipment across both tables
CREATE OR REPLACE FUNCTION search_equipment(
  p_company_id UUID,
  p_search_term TEXT
) 
RETURNS TABLE (
  table_source TEXT,
  id INTEGER,
  os TEXT,
  equipamento TEXT,
  fabricante TEXT,
  modelo TEXT,
  setor TEXT,
  abertura TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'maintenance'::TEXT as table_source,
    mo.id,
    mo.os,
    mo.equipamento,
    mo.fabricante,
    mo.modelo,
    mo.setor,
    mo.abertura,
    ts_rank(to_tsvector('portuguese', 
      COALESCE(mo.equipamento, '') || ' ' || 
      COALESCE(mo.fabricante, '') || ' ' || 
      COALESCE(mo.modelo, '')
    ), plainto_tsquery('portuguese', p_search_term)) as rank
  FROM maintenance_orders mo
  WHERE mo.company_id = p_company_id
    AND to_tsvector('portuguese', 
        COALESCE(mo.equipamento, '') || ' ' || 
        COALESCE(mo.fabricante, '') || ' ' || 
        COALESCE(mo.modelo, '')
      ) @@ plainto_tsquery('portuguese', p_search_term)
  
  UNION ALL
  
  SELECT 
    'building'::TEXT as table_source,
    bo.id,
    bo.os,
    bo.equipamento,
    bo.fabricante,
    bo.modelo,
    bo.setor,
    bo.abertura,
    ts_rank(to_tsvector('portuguese', 
      COALESCE(bo.equipamento, '') || ' ' || 
      COALESCE(bo.fabricante, '') || ' ' || 
      COALESCE(bo.modelo, '')
    ), plainto_tsquery('portuguese', p_search_term)) as rank
  FROM building_orders bo
  WHERE bo.company_id = p_company_id
    AND to_tsvector('portuguese', 
        COALESCE(bo.equipamento, '') || ' ' || 
        COALESCE(bo.fabricante, '') || ' ' || 
        COALESCE(bo.modelo, '')
      ) @@ plainto_tsquery('portuguese', p_search_term)
  
  ORDER BY rank DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all search indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
AND indexname LIKE '%_fts'
ORDER BY tablename, pg_relation_size(indexrelid) DESC;

-- Test search performance examples

-- Equipment search test
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM search_equipment(
--   'your-company-uuid',
--   'bomba centrifuga'
-- );

-- Description search test
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT 
--   os,
--   equipamento,
--   ocorrencia,
--   ts_rank(to_tsvector('portuguese', 
--     COALESCE(ocorrencia, '') || ' ' || COALESCE(servico, '')
--   ), plainto_tsquery('portuguese', 'vazamento pressão')) as rank
-- FROM maintenance_orders
-- WHERE company_id = 'your-company-uuid'
--   AND to_tsvector('portuguese', 
--       COALESCE(ocorrencia, '') || ' ' || COALESCE(servico, '')
--     ) @@ plainto_tsquery('portuguese', 'vazamento pressão')
-- ORDER BY rank DESC
-- LIMIT 20;

-- Asset identifier search test
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT os, equipamento, tag, patrimonio
-- FROM maintenance_orders
-- WHERE company_id = 'your-company-uuid'
--   AND to_tsvector('simple', 
--       COALESCE(tag, '') || ' ' || COALESCE(patrimonio, '')
--     ) @@ to_tsquery('simple', '12345')
-- LIMIT 20;

-- Update statistics
ANALYZE maintenance_orders;
ANALYZE building_orders;