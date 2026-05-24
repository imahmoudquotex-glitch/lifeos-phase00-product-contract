-- pgTAP isolation tests for ai_usage_events RLS
BEGIN;

SELECT plan(2);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug, monthly_ai_token_limit) VALUES ('ws_ai1','AI1','ai1',100000),('ws_ai2','AI2','ai2',100000) ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_ai1','ai1@x.com'),('u_ai2','ai2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_ai1','u_ai1','owner'),('ws_ai2','u_ai2','owner') ON CONFLICT DO NOTHING$$);

-- Seed via the RPC to respect quota checks
SELECT _test_seed_row($$SELECT reserve_ai_usage('ev_ai1','ws_ai1','u_ai1','idem1',100)$$);
SELECT _test_seed_row($$SELECT reserve_ai_usage('ev_ai2','ws_ai2','u_ai2','idem2',100)$$);

SELECT set_config('app.current_workspace_id','ws_ai1',true);
SELECT results_eq(
	'SELECT id FROM ai_usage_events WHERE id IN (''ev_ai1'',''ev_ai2'')',
	ARRAY['ev_ai1']::TEXT[],
	'ws_ai1 sees only ev_ai1'
);

SELECT set_config('app.current_workspace_id','ws_ai2',true);
SELECT results_eq(
	'SELECT id FROM ai_usage_events WHERE id IN (''ev_ai1'',''ev_ai2'')',
	ARRAY['ev_ai2']::TEXT[],
	'ws_ai2 sees only ev_ai2'
);

SELECT * FROM finish();
ROLLBACK;
