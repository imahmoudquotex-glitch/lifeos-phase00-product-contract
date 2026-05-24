-- pgTAP isolation tests for habits + habit_checkins
BEGIN;

SELECT plan(3);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_h1','H1','h1'),('ws_h2','H2','h2') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_h1','h1@x.com'),('u_h2','h2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_h1','u_h1','owner'),('ws_h2','u_h2','owner') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO habits (id, workspace_id, created_by, title) VALUES ('hab_h1','ws_h1','u_h1','H1'),('hab_h2','ws_h2','u_h2','H2')$$);

SELECT set_config('app.current_workspace_id','ws_h1',true);
SELECT results_eq(
	'SELECT id FROM habits WHERE id IN (''hab_h1'',''hab_h2'') AND is_deleted = false',
	ARRAY['hab_h1']::TEXT[],
	'ws_h1 sees only hab_h1'
);

SELECT set_config('app.current_workspace_id','ws_h2',true);
SELECT results_eq(
	'SELECT id FROM habits WHERE id IN (''hab_h1'',''hab_h2'') AND is_deleted = false',
	ARRAY['hab_h2']::TEXT[],
	'ws_h2 sees only hab_h2'
);

-- habit_checkins cross-workspace
SELECT _test_seed_row($$INSERT INTO habit_checkins (id, habit_id, workspace_id, user_id, checkin_date) VALUES ('hc_h2','hab_h2','ws_h2','u_h2','2026-05-01')$$);
SELECT set_config('app.current_workspace_id','ws_h1',true);
SELECT results_eq(
	'SELECT COUNT(*)::int FROM habit_checkins WHERE id = ''hc_h2''',
	ARRAY[0]::INT[],
	'ws_h1 cannot see ws_h2 habit_checkins'
);

SELECT * FROM finish();
ROLLBACK;
