-- File: 0118__seed_admin_role_check.sql
-- Phase: 02
-- Description: NO seed data. Pure assertion.
-- Idempotent: YES
BEGIN;

DO $$
BEGIN
  PERFORM 1
    FROM information_schema.check_constraints
   WHERE constraint_name = 'workspace_memberships_role_check';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phase 02 smoke failed: role CHECK missing';
  END IF;
END $$;

COMMIT;

-- ROLLBACK:
-- (no-op — assertion only)
