-- ============================================================================
-- COMPLETE TIMESTAMP FIX - Replace empty timestamp strings with NULL
-- ============================================================================
-- This fixes both existing data and the root cause of your React application error

-- ============================================================================
-- STEP 1: Fix maintenance_orders table (existing data cleanup)
-- ============================================================================

UPDATE maintenance_orders SET abertura = NULL WHERE abertura::text = '';
UPDATE maintenance_orders SET fechamento = NULL WHERE fechamento::text = '';
UPDATE maintenance_orders SET parada = NULL WHERE parada::text = '';
UPDATE maintenance_orders SET funcionamento = NULL WHERE funcionamento::text = '';
UPDATE maintenance_orders SET data_chamado = NULL WHERE data_chamado::text = '';
UPDATE maintenance_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';
UPDATE maintenance_orders SET data_solucao = NULL WHERE data_solucao::text = '';
UPDATE maintenance_orders SET data_inicial_mo = NULL WHERE data_inicial_mo::text = '';
UPDATE maintenance_orders SET data_fim_mo = NULL WHERE data_fim_mo::text = '';
UPDATE maintenance_orders SET inicio_pendencia = NULL WHERE inicio_pendencia::text = '';
UPDATE maintenance_orders SET fechamento_pendencia = NULL WHERE fechamento_pendencia::text = '';
UPDATE maintenance_orders SET cadastro = NULL WHERE cadastro::text = '';
UPDATE maintenance_orders SET instalacao = NULL WHERE instalacao::text = '';
UPDATE maintenance_orders SET garantia = NULL WHERE garantia::text = '';
UPDATE maintenance_orders SET verificacao = NULL WHERE verificacao::text = '';

-- ============================================================================
-- STEP 2: Fix building_orders table (existing data cleanup) - CRITICAL FOR "Engenharia Predial"
-- ============================================================================

UPDATE building_orders SET abertura = NULL WHERE abertura::text = '';
UPDATE building_orders SET fechamento = NULL WHERE fechamento::text = '';
UPDATE building_orders SET parada = NULL WHERE parada::text = '';
UPDATE building_orders SET funcionamento = NULL WHERE funcionamento::text = '';
UPDATE building_orders SET data_chamado = NULL WHERE data_chamado::text = '';
UPDATE building_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';
UPDATE building_orders SET data_solucao = NULL WHERE data_solucao::text = '';
UPDATE building_orders SET data_inicial_mo = NULL WHERE data_inicial_mo::text = '';
UPDATE building_orders SET data_fim_mo = NULL WHERE data_fim_mo::text = '';
UPDATE building_orders SET inicio_pendencia = NULL WHERE inicio_pendencia::text = '';
UPDATE building_orders SET fechamento_pendencia = NULL WHERE fechamento_pendencia::text = '';

-- ============================================================================
-- STEP 3: Create triggers to prevent future empty string insertions
-- ============================================================================

-- Function to convert empty strings to NULL for timestamp columns
CREATE OR REPLACE FUNCTION convert_empty_timestamps_to_null()
RETURNS TRIGGER AS $$
BEGIN
    -- Convert empty strings to NULL for all timestamp columns
    IF NEW.abertura::text = '' THEN NEW.abertura = NULL; END IF;
    IF NEW.fechamento::text = '' THEN NEW.fechamento = NULL; END IF;
    IF NEW.parada::text = '' THEN NEW.parada = NULL; END IF;
    IF NEW.funcionamento::text = '' THEN NEW.funcionamento = NULL; END IF;
    IF NEW.data_chamado::text = '' THEN NEW.data_chamado = NULL; END IF;
    IF NEW.data_atendimento::text = '' THEN NEW.data_atendimento = NULL; END IF;
    IF NEW.data_solucao::text = '' THEN NEW.data_solucao = NULL; END IF;
    IF NEW.data_inicial_mo::text = '' THEN NEW.data_inicial_mo = NULL; END IF;
    IF NEW.data_fim_mo::text = '' THEN NEW.data_fim_mo = NULL; END IF;
    IF NEW.inicio_pendencia::text = '' THEN NEW.inicio_pendencia = NULL; END IF;
    IF NEW.fechamento_pendencia::text = '' THEN NEW.fechamento_pendencia = NULL; END IF;

    -- For maintenance_orders additional columns
    IF TG_TABLE_NAME = 'maintenance_orders' THEN
        IF NEW.cadastro::text = '' THEN NEW.cadastro = NULL; END IF;
        IF NEW.instalacao::text = '' THEN NEW.instalacao = NULL; END IF;
        IF NEW.garantia::text = '' THEN NEW.garantia = NULL; END IF;
        IF NEW.verificacao::text = '' THEN NEW.verificacao = NULL; END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS prevent_empty_timestamps_maintenance ON maintenance_orders;
CREATE TRIGGER prevent_empty_timestamps_maintenance
    BEFORE INSERT OR UPDATE ON maintenance_orders
    FOR EACH ROW EXECUTE FUNCTION convert_empty_timestamps_to_null();

DROP TRIGGER IF EXISTS prevent_empty_timestamps_building ON building_orders;
CREATE TRIGGER prevent_empty_timestamps_building
    BEFORE INSERT OR UPDATE ON building_orders
    FOR EACH ROW EXECUTE FUNCTION convert_empty_timestamps_to_null();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check maintenance_orders
SELECT
    'maintenance_orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN abertura::text = '' THEN 1 END) as empty_abertura_count,
    COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as empty_fechamento_count
FROM maintenance_orders;

-- Check building_orders
SELECT
    'building_orders' as table_name,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN abertura::text = '' THEN 1 END) as empty_abertura_count,
    COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as empty_fechamento_count
FROM building_orders;