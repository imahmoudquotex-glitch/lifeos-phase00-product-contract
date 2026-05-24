-- pgTAP isolation tests for tasks table
BEGIN;

SELECT plan(4);

-- Seed two workspaces + users
SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_t1','T1','t1'),('ws_t2','T2','t2') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_t1','t1@x.com'),('u_t2','t2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_t1','u_t1','owner'),('ws_t2','u_t2','owner') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO tasks (id, workspace_id, created_by, title) VALUES ('tsk_t1','ws_t1','u_t1','Task T1'),('tsk_t2','ws_t2','u_t2','Task T2')$$);

-- 1. Workspace t1 can only see its own task
SELECT set_config('app.current_workspace_id','ws_t1',true);
SELECT results_eq(
	'SELECT id FROM tasks WHERE id IN (''tsk_t1'',''tsk_t2'') AND is_deleted = false ORDER BY id',
	ARRAY['tsk_t1']::TEXT[],
	'ws_t1 sees only tsk_t1'
);

-- 2. Workspace t2 can only see its own task
SELECT set_config('app.current_workspace_id','ws_t2',true);
SELECT results_eq(
	'SELECT id FROM tasks WHERE id IN (''tsk_t1'',''tsk_t2'') AND is_deleted = false ORDER BY id',
	ARRAY['tsk_t2']::TEXT[],
	'ws_t2 sees only tsk_t2'
);

-- 3. ws_t1 cannot INSERT into ws_t2
SELECT set_config('app.current_workspace_id','ws_t1',true);
SELECT throws_ok(
	$$INSERT INTO tasks (id, workspace_id, created_by, title) VALUES ('tsk_bad','ws_t2','u_t1','X')$$,
	'P0001',
	NULL,
	'ws_t1 cannot insert into ws_t2'
);

-- 4. Soft-deleted task not visible
SELECT set_config('app.current_workspace_id','ws_t1',true);
SELECT _test_seed_row($$UPDATE tasks SET is_deleted = true WHERE id = 'tsk_t1'$$);
SELECT results_eq(
	'SELECT COUNT(*)::int FROM tasks WHERE id = ''tsk_t1'' AND is_deleted = false',
	ARRAY[0]::INT[],
	'soft-deleted task not visible'
);

SELECT * FROM finish();
ROLLBACK;
