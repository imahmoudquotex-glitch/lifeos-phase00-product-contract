BEGIN;

-- csp_reports: nullable workspace_id (pre-auth reports allowed)
ALTER TABLE csp_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csp_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY csp_reports_select ON csp_reports FOR SELECT
	USING (workspace_id IS NULL OR workspace_id = current_setting('app.current_workspace_id', true));
CREATE POLICY csp_reports_insert ON csp_reports FOR INSERT WITH CHECK (true);

-- csrf_tokens: scoped by session -> indirectly by user
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrf_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY csrf_tokens_all ON csrf_tokens FOR ALL
	USING (
		EXISTS (
			SELECT 1 FROM sessions s
			WHERE s.id = csrf_tokens.session_id
			  AND s.user_id = current_setting('app.current_user_id', true)
		)
	);

-- push_subscriptions: workspace_id tenant-scoped
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY push_subs_all ON push_subscriptions FOR ALL
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

-- device_registry: workspace_id + user_id double-guard
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry FORCE ROW LEVEL SECURITY;
CREATE POLICY device_registry_all ON device_registry FOR ALL
	USING (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND user_id = current_setting('app.current_user_id', true)
	)
	WITH CHECK (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND user_id = current_setting('app.current_user_id', true)
	);

-- outbox_dead_letter: workspace_id tenant-scoped
ALTER TABLE outbox_dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dead_letter FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_dl_all ON outbox_dead_letter FOR ALL
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

-- oauth_state_store: no RLS (pre-auth flow); protected by TTL + consume-once

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0156', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS csp_reports_select ON csp_reports; DROP POLICY IF EXISTS csp_reports_insert ON csp_reports; ALTER TABLE csp_reports DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS csrf_tokens_all ON csrf_tokens; ALTER TABLE csrf_tokens DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS push_subs_all ON push_subscriptions; ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS device_registry_all ON device_registry; ALTER TABLE device_registry DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS outbox_dl_all ON outbox_dead_letter; ALTER TABLE outbox_dead_letter DISABLE ROW LEVEL SECURITY;
-- DELETE FROM schema_migrations WHERE version='0156';
-- COMMIT;
