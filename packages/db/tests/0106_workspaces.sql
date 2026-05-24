BEGIN;
SELECT plan(8);

SELECT has_table('public', 'workspaces', 'workspaces table exists');
SELECT has_column('public', 'workspaces', 'id', 'id exists');
SELECT has_column('public', 'workspaces', 'slug', 'slug exists');
SELECT has_column('public', 'workspaces', 'name', 'name exists');
SELECT has_column('public', 'workspaces', 'owner_user_id', 'owner_user_id exists');
SELECT col_is_pk('public', 'workspaces', ARRAY['id'], 'id is primary key');
SELECT col_is_unique('public', 'workspaces', ARRAY['slug'], 'slug is unique');
SELECT fk_ok('public', 'workspaces', 'owner_user_id', 'public', 'users', 'id', 'owner_user_id references users(id)');

SELECT * FROM finish();
ROLLBACK;
