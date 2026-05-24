-- pgTAP isolation tests for vault_items (workspace + owner isolation)
BEGIN;

SELECT plan(3);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_v1','V1','v1') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_v1','v1@x.com'),('u_v2','v2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_v1','u_v1','owner'),('ws_v1','u_v2','member') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO vault_items (id, workspace_id, owner_user_id, item_type, title_hash) VALUES ('vi_v1','ws_v1','u_v1','password','h1'),('vi_v2','ws_v1','u_v2','note','h2')$$);

-- User v1 sees only own item
SELECT set_config('app.current_workspace_id','ws_v1',true);
SELECT set_config('app.current_user_id','u_v1',true);
SELECT results_eq(
	'SELECT id FROM vault_items WHERE id IN (''vi_v1'',''vi_v2'') AND is_deleted = false',
	ARRAY['vi_v1']::TEXT[],
	'u_v1 sees only vi_v1'
);

-- User v2 sees only own item
SELECT set_config('app.current_user_id','u_v2',true);
SELECT results_eq(
	'SELECT id FROM vault_items WHERE id IN (''vi_v1'',''vi_v2'') AND is_deleted = false',
	ARRAY['vi_v2']::TEXT[],
	'u_v2 sees only vi_v2'
);

-- User v1 cannot insert item owned by v2
SELECT set_config('app.current_user_id','u_v1',true);
SELECT throws_ok(
	$$INSERT INTO vault_items (id, workspace_id, owner_user_id, item_type, title_hash) VALUES ('vi_bad','ws_v1','u_v2','note','hbad')$$,
	'P0001',
	NULL,
	'u_v1 cannot insert item for u_v2'
);

SELECT * FROM finish();
ROLLBACK;
