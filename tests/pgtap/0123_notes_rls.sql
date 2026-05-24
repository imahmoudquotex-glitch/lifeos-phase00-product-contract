-- pgTAP isolation tests for notes + note_versions tables
BEGIN;

SELECT plan(3);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_n1','N1','n1'),('ws_n2','N2','n2') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_n1','n1@x.com'),('u_n2','n2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_n1','u_n1','owner'),('ws_n2','u_n2','owner') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO notes (id, workspace_id, created_by, title, body_md) VALUES ('note_n1','ws_n1','u_n1','N1',''),('note_n2','ws_n2','u_n2','N2','')$$);

SELECT set_config('app.current_workspace_id','ws_n1',true);
SELECT results_eq(
	'SELECT id FROM notes WHERE id IN (''note_n1'',''note_n2'') AND is_deleted = false',
	ARRAY['note_n1']::TEXT[],
	'ws_n1 sees only note_n1'
);

SELECT set_config('app.current_workspace_id','ws_n2',true);
SELECT results_eq(
	'SELECT id FROM notes WHERE id IN (''note_n1'',''note_n2'') AND is_deleted = false',
	ARRAY['note_n2']::TEXT[],
	'ws_n2 sees only note_n2'
);

-- note_versions cross-workspace isolation
SELECT _test_seed_row($$INSERT INTO note_versions (id, note_id, workspace_id, version, title, body_md, edited_by) VALUES ('nv1','note_n2','ws_n2',1,'N2','','u_n2')$$);
SELECT set_config('app.current_workspace_id','ws_n1',true);
SELECT results_eq(
	'SELECT COUNT(*)::int FROM note_versions WHERE id = ''nv1''',
	ARRAY[0]::INT[],
	'ws_n1 cannot see ws_n2 note_versions'
);

SELECT * FROM finish();
ROLLBACK;
