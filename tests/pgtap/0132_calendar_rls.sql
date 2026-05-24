-- pgTAP isolation tests for calendar_events
BEGIN;

SELECT plan(2);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_c1','C1','c1'),('ws_c2','C2','c2') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_c1','c1@x.com'),('u_c2','c2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_c1','u_c1','owner'),('ws_c2','u_c2','owner') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO calendar_events (id, workspace_id, created_by, title, starts_at, ends_at) VALUES ('ev_c1','ws_c1','u_c1','E1','2026-05-01 10:00','2026-05-01 11:00'),('ev_c2','ws_c2','u_c2','E2','2026-05-01 10:00','2026-05-01 11:00')$$);

SELECT set_config('app.current_workspace_id','ws_c1',true);
SELECT results_eq(
	'SELECT id FROM calendar_events WHERE id IN (''ev_c1'',''ev_c2'') AND is_deleted = false',
	ARRAY['ev_c1']::TEXT[],
	'ws_c1 sees only ev_c1'
);

SELECT set_config('app.current_workspace_id','ws_c2',true);
SELECT results_eq(
	'SELECT id FROM calendar_events WHERE id IN (''ev_c1'',''ev_c2'') AND is_deleted = false',
	ARRAY['ev_c2']::TEXT[],
	'ws_c2 sees only ev_c2'
);

SELECT * FROM finish();
ROLLBACK;
