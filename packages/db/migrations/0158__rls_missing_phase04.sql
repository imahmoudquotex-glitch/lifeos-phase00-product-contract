BEGIN;

-- audit_logs: workspace_id tenant-scoped
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_all ON audit_logs FOR ALL
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

-- rate_limit_buckets: workspace_id tenant-scoped
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets FORCE ROW LEVEL SECURITY;
CREATE POLICY rate_limit_buckets_all ON rate_limit_buckets FOR ALL
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

-- outbound_emails: workspace_id tenant-scoped
ALTER TABLE outbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_emails FORCE ROW LEVEL SECURITY;
CREATE POLICY outbound_emails_all ON outbound_emails FOR ALL
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

-- oauth_state_store: workspace_id tenant-scoped (pre-auth flow usually doesn't have workspace, but schema has it)
ALTER TABLE oauth_state_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_state_store FORCE ROW LEVEL SECURITY;
CREATE POLICY oauth_state_store_all ON oauth_state_store FOR ALL
	USING (workspace_id IS NULL OR workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id IS NULL OR workspace_id = current_setting('app.current_workspace_id', true));

COMMIT;
