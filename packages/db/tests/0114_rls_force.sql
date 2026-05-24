BEGIN;
SELECT plan(10);

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'workspaces' $$,
    $$ VALUES (true) $$,
    'workspaces has RLS enabled'
);
SELECT results_eq(
    $$ SELECT relforcerowsecurity FROM pg_class WHERE relname = 'workspaces' $$,
    $$ VALUES (true) $$,
    'workspaces has RLS forced'
);

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'workspace_memberships' $$,
    $$ VALUES (true) $$,
    'workspace_memberships has RLS enabled'
);
SELECT results_eq(
    $$ SELECT relforcerowsecurity FROM pg_class WHERE relname = 'workspace_memberships' $$,
    $$ VALUES (true) $$,
    'workspace_memberships has RLS forced'
);

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'pages' $$,
    $$ VALUES (true) $$,
    'pages has RLS enabled'
);
SELECT results_eq(
    $$ SELECT relforcerowsecurity FROM pg_class WHERE relname = 'pages' $$,
    $$ VALUES (true) $$,
    'pages has RLS forced'
);

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'workspace_audit_events' $$,
    $$ VALUES (true) $$,
    'workspace_audit_events has RLS enabled'
);
SELECT results_eq(
    $$ SELECT relforcerowsecurity FROM pg_class WHERE relname = 'workspace_audit_events' $$,
    $$ VALUES (true) $$,
    'workspace_audit_events has RLS forced'
);

SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'workspace_invitations' $$,
    $$ VALUES (true) $$,
    'workspace_invitations has RLS enabled'
);
SELECT results_eq(
    $$ SELECT relforcerowsecurity FROM pg_class WHERE relname = 'workspace_invitations' $$,
    $$ VALUES (true) $$,
    'workspace_invitations has RLS forced'
);

SELECT * FROM finish();
ROLLBACK;
