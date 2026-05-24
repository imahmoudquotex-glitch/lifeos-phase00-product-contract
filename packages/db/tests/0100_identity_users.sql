BEGIN;
SELECT plan(8);

SELECT has_table('public', 'users', 'users table exists');
SELECT has_column('public', 'users', 'id', 'id exists');
SELECT has_column('public', 'users', 'email', 'email exists');
SELECT has_column('public', 'users', 'status', 'status exists');
SELECT col_is_pk('public', 'users', ARRAY['id'], 'id is primary key');
SELECT col_is_unique('public', 'users', ARRAY['email'], 'email is unique');
SELECT col_not_null('public', 'users', 'email', 'email is not null');
SELECT col_default_is('public', 'users', 'status', 'active', 'status defaults to active');

SELECT * FROM finish();
ROLLBACK;
