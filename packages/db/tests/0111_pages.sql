BEGIN;
SELECT plan(10);

SELECT has_table('public', 'pages', 'pages table exists');
SELECT has_column('public', 'pages', 'id', 'id exists');
SELECT has_column('public', 'pages', 'workspace_id', 'workspace_id exists');
SELECT has_column('public', 'pages', 'parent_id', 'parent_id exists');
SELECT has_column('public', 'pages', 'title', 'title exists');
SELECT has_column('public', 'pages', 'slug', 'slug exists');
SELECT col_is_pk('public', 'pages', ARRAY['id'], 'id is primary key');
SELECT fk_ok('public', 'pages', 'workspace_id', 'public', 'workspaces', 'id', 'workspace_id references workspaces(id)');
SELECT fk_ok('public', 'pages', 'parent_id', 'public', 'pages', 'id', 'parent_id references pages(id)');
SELECT fk_ok('public', 'pages', 'created_by', 'public', 'users', 'id', 'created_by references users(id)');

SELECT * FROM finish();
ROLLBACK;
