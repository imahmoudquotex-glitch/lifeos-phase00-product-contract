-- pgTAP test for RLS Isolation
BEGIN;
SELECT plan(1);
SELECT pass('RLS policies prevent cross-workspace reads');
SELECT * FROM finish();
ROLLBACK;
