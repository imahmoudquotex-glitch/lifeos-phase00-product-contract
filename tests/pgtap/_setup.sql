-- pgTAP test setup helpers
-- SECURITY DEFINER so tests can seed rows bypassing RLS safely in test env

CREATE OR REPLACE FUNCTION _test_seed_row(p_sql TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN EXECUTE p_sql; END;
$$;

-- Revoke from public to prevent misuse
REVOKE ALL ON FUNCTION _test_seed_row(TEXT) FROM PUBLIC;
