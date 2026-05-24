BEGIN;

CREATE OR REPLACE FUNCTION lookup_public_share(p_token TEXT)
RETURNS TABLE (
	workspace_id TEXT,
	resource_type TEXT,
	resource_id TEXT,
	expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
	RETURN QUERY
	SELECT s.workspace_id, s.resource_type, s.resource_id, s.expires_at
	FROM public_shares s
	WHERE s.token_hash = encode(digest(p_token, 'sha256'), 'hex')
	  AND (s.expires_at IS NULL OR s.expires_at > now())
	  AND s.revoked_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION lookup_public_share(TEXT) FROM PUBLIC;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0157', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP FUNCTION IF EXISTS lookup_public_share(TEXT);
-- DELETE FROM schema_migrations WHERE version='0157';
-- COMMIT;
