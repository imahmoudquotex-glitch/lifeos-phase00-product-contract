-- pgTAP isolation tests for expenses + budgets
BEGIN;

SELECT plan(3);

SELECT _test_seed_row($$INSERT INTO workspaces (id, name, slug) VALUES ('ws_e1','E1','e1'),('ws_e2','E2','e2') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_e1','e1@x.com'),('u_e2','e2@x.com') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('ws_e1','u_e1','owner'),('ws_e2','u_e2','owner') ON CONFLICT DO NOTHING$$);
SELECT _test_seed_row($$INSERT INTO expenses (id, workspace_id, created_by, amount_cents, currency, category, spent_at) VALUES ('exp_e1','ws_e1','u_e1',500,'USD','food','2026-05-01'),('exp_e2','ws_e2','u_e2',800,'USD','food','2026-05-01')$$);
SELECT _test_seed_row($$INSERT INTO budgets (id, workspace_id, category, monthly_limit_cents, currency) VALUES ('bud_e1','ws_e1','food',10000,'USD'),('bud_e2','ws_e2','food',10000,'USD')$$);

SELECT set_config('app.current_workspace_id','ws_e1',true);
SELECT results_eq(
	'SELECT id FROM expenses WHERE id IN (''exp_e1'',''exp_e2'') AND is_deleted = false',
	ARRAY['exp_e1']::TEXT[],
	'ws_e1 sees only exp_e1'
);

SELECT set_config('app.current_workspace_id','ws_e2',true);
SELECT results_eq(
	'SELECT id FROM expenses WHERE id IN (''exp_e1'',''exp_e2'') AND is_deleted = false',
	ARRAY['exp_e2']::TEXT[],
	'ws_e2 sees only exp_e2'
);

SELECT set_config('app.current_workspace_id','ws_e1',true);
SELECT results_eq(
	'SELECT id FROM budgets WHERE id IN (''bud_e1'',''bud_e2'')',
	ARRAY['bud_e1']::TEXT[],
	'ws_e1 sees only bud_e1'
);

SELECT * FROM finish();
ROLLBACK;
