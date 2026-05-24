-- pgTAP Phase 05 tests
-- Verifies migration 0200–0204 schema contracts

BEGIN;

SELECT plan(12);

-- 0200: users.locale column
SELECT has_column('public', 'users', 'locale', 'users.locale exists');
SELECT col_default_is('public', 'users', 'locale', 'en', 'users.locale default is en');
SELECT col_not_null('public', 'users', 'locale', 'users.locale is NOT NULL');

-- 0201: rate_limit_buckets.bucket_kind
SELECT has_column('public', 'rate_limit_buckets', 'bucket_kind', 'rate_limit_buckets.bucket_kind exists');
SELECT col_default_is('public', 'rate_limit_buckets', 'bucket_kind', 'generic', 'bucket_kind defaults to generic');

-- 0202: email_templates_registry table
SELECT has_table('public', 'email_templates_registry', 'email_templates_registry table exists');
SELECT results_eq(
	$$SELECT COUNT(*)::int FROM email_templates_registry WHERE locale = 'ar'$$,
	$$VALUES (4)$$,
	'4 Arabic email templates registered'
);
SELECT results_eq(
	$$SELECT COUNT(*)::int FROM email_templates_registry WHERE locale = 'en'$$,
	$$VALUES (4)$$,
	'4 English email templates registered'
);

-- 0203: zenith_ui_preferences table + RLS
SELECT has_table('public', 'zenith_ui_preferences', 'zenith_ui_preferences table exists');
SELECT has_column('public', 'zenith_ui_preferences', 'accent_color', 'zenith_ui_preferences.accent_color exists');
SELECT table_privs_are('public', 'zenith_ui_preferences', 'authenticated', ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'RLS allows authenticated user CRUD on own prefs');

-- 0204: partial indexes exist
SELECT has_index('public', 'workspace_audit_events', 'idx_audit_signin_failures', 'signin failures partial index exists');

SELECT * FROM finish();
ROLLBACK;
