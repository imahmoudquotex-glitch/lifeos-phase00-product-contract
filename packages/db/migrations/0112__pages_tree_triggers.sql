-- File: 0112__pages_tree_triggers.sql
-- Phase: 02
-- Description: Triggers to keep depth consistent on INSERT/UPDATE.
-- Idempotent: YES
BEGIN;

CREATE OR REPLACE FUNCTION fn_pages_compute_depth() RETURNS TRIGGER AS $$
DECLARE
  parent_depth INT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
  ELSE
    SELECT depth INTO parent_depth
      FROM pages
     WHERE id = NEW.parent_id
       AND workspace_id = NEW.workspace_id;
    IF parent_depth IS NULL THEN
      RAISE EXCEPTION 'PAGE_PARENT_NOT_IN_WORKSPACE' USING ERRCODE = '22000';
    END IF;
    NEW.depth := parent_depth + 1;
    IF NEW.depth > 50 THEN
      RAISE EXCEPTION 'PAGE_DEPTH_EXCEEDED' USING ERRCODE = '22000';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_compute_depth_ins ON pages;
CREATE TRIGGER trg_pages_compute_depth_ins
  BEFORE INSERT ON pages
  FOR EACH ROW EXECUTE FUNCTION fn_pages_compute_depth();

DROP TRIGGER IF EXISTS trg_pages_compute_depth_upd ON pages;
CREATE TRIGGER trg_pages_compute_depth_upd
  BEFORE UPDATE OF parent_id ON pages
  FOR EACH ROW
  WHEN (NEW.parent_id IS DISTINCT FROM OLD.parent_id)
  EXECUTE FUNCTION fn_pages_compute_depth();

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_pages_compute_depth_upd ON pages;
--   DROP TRIGGER IF EXISTS trg_pages_compute_depth_ins ON pages;
--   DROP FUNCTION IF EXISTS fn_pages_compute_depth();
-- COMMIT;
