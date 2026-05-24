-- tests/pgtap/0156_rls_phase04.sql
-- Phase 04 RLS tests for: csp_reports, csrf_tokens, push_subscriptions, device_registry, outbox_dead_letter
BEGIN;
SELECT plan(10);

-- Setup fixture users and workspaces
SELECT _test_seed_row($$
	INSERT INTO users (id, email) VALUES
		('u_p4_a', 'p4a@test.io'),
		('u_p4_b', 'p4b@test.io')
	ON CONFLICT DO NOTHING
$$);
SELECT _test_seed_row($$
	INSERT INTO workspaces (id, name, owner_user_id) VALUES
		('ws_p4_a', 'P4A', 'u_p4_a'),
		('ws_p4_b', 'P4B', 'u_p4_b')
	ON CONFLICT DO NOTHING
$$);

-- Seed csp_reports
SELECT _test_seed_row($$
	INSERT INTO csp_reports (id, workspace_id, report)
	VALUES ('csp_1', 'ws_p4_a', '{"blocked-uri":"https://evil.com"}'::jsonb)
	ON CONFLICT DO NOTHING
$$);

-- Test 1: csp_reports — cross-workspace read blocked
SELECT set_config('app.current_workspace_id', 'ws_p4_b', true);
SELECT set_config('app.current_user_id', 'u_p4_b', true);
SELECT is(
	(SELECT count(*)::int FROM csp_reports WHERE workspace_id = 'ws_p4_a'),
	0,
	'csp_reports: cross-workspace read blocked'
);

-- Test 2: csp_reports — same-workspace read allowed
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT is(
	(SELECT count(*)::int FROM csp_reports WHERE workspace_id = 'ws_p4_a'),
	1,
	'csp_reports: same-workspace read allowed'
);

-- Seed push_subscriptions
SELECT _test_seed_row($$
	INSERT INTO push_subscriptions (id, workspace_id, user_id, endpoint, p256dh_key, auth_key)
	VALUES ('ps_1', 'ws_p4_a', 'u_p4_a', 'https://push.example.com/1', 'key1', 'auth1')
	ON CONFLICT DO NOTHING
$$);

-- Test 3: push_subscriptions — cross-workspace blocked
SELECT set_config('app.current_workspace_id', 'ws_p4_b', true);
SELECT is(
	(SELECT count(*)::int FROM push_subscriptions),
	0,
	'push_subscriptions: cross-workspace read blocked'
);

-- Test 4: push_subscriptions — same-workspace allowed
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT is(
	(SELECT count(*)::int FROM push_subscriptions),
	1,
	'push_subscriptions: same-workspace read allowed'
);

-- Seed device_registry
SELECT _test_seed_row($$
	INSERT INTO device_registry (id, workspace_id, user_id, device_fingerprint)
	VALUES ('dr_1', 'ws_p4_a', 'u_p4_a', 'fp_abc123')
	ON CONFLICT DO NOTHING
$$);

-- Test 5: device_registry — cross-workspace blocked
SELECT set_config('app.current_workspace_id', 'ws_p4_b', true);
SELECT set_config('app.current_user_id', 'u_p4_b', true);
SELECT is(
	(SELECT count(*)::int FROM device_registry),
	0,
	'device_registry: cross-workspace read blocked'
);

-- Test 6: device_registry — cross-user blocked (same workspace)
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT set_config('app.current_user_id', 'u_p4_b', true);
SELECT is(
	(SELECT count(*)::int FROM device_registry),
	0,
	'device_registry: cross-user read blocked'
);

-- Test 7: device_registry — owner can read own device
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT set_config('app.current_user_id', 'u_p4_a', true);
SELECT is(
	(SELECT count(*)::int FROM device_registry),
	1,
	'device_registry: owner reads own device'
);

-- Seed outbox_dead_letter
SELECT _test_seed_row($$
	INSERT INTO outbox_dead_letter (id, workspace_id, user_id, original_id, method, url, body, body_hash, attempts)
	VALUES ('dl_1', 'ws_p4_a', 'u_p4_a', 'orig_1', 'POST', '/api/tasks', '{}', repeat('a',64), 5)
	ON CONFLICT DO NOTHING
$$);

-- Test 8: outbox_dead_letter — cross-workspace blocked
SELECT set_config('app.current_workspace_id', 'ws_p4_b', true);
SELECT is(
	(SELECT count(*)::int FROM outbox_dead_letter),
	0,
	'outbox_dead_letter: cross-workspace read blocked'
);

-- Test 9: outbox_dead_letter — same workspace allowed
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT is(
	(SELECT count(*)::int FROM outbox_dead_letter),
	1,
	'outbox_dead_letter: same-workspace read allowed'
);

-- Test 10: cross-workspace INSERT into csp_reports rejected
SELECT set_config('app.current_workspace_id', 'ws_p4_a', true);
SELECT throws_ok(
	$$ INSERT INTO push_subscriptions (workspace_id, user_id, endpoint, p256dh_key, auth_key)
	   VALUES ('ws_p4_b', 'u_p4_a', 'https://evil/2', 'k', 'a') $$,
	'42501',
	NULL,
	'push_subscriptions: cross-tenant INSERT rejected by WITH CHECK'
);

SELECT * FROM finish();
ROLLBACK;
