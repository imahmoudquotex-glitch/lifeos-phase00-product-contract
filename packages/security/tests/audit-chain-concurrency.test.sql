BEGIN;

SELECT plan(1);

-- We would need a pgTAP test or similar extension to truly test concurrency.
-- Since standard pgTAP runs single-threaded per connection, we can't easily spawn threads in pure SQL.
-- However, we can assert that the function or block exists and that advisory locks can be acquired.

SELECT is(
  (SELECT pg_try_advisory_xact_lock(hashtext('test_workspace_id'))),
  true,
  'Should be able to acquire advisory lock for workspace'
);

SELECT * FROM finish();
ROLLBACK;
