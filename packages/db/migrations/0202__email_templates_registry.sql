BEGIN;

-- ADR-0028: email templates registry for tracking available templates per locale
-- Phase 05, migration 0202

CREATE TABLE IF NOT EXISTS email_templates_registry (
	name    TEXT NOT NULL,
	locale  TEXT NOT NULL,
	version INTEGER NOT NULL DEFAULT 1,
	active  BOOLEAN NOT NULL DEFAULT true,
	registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (name, locale)
);

-- Register all 8 Phase 05 templates
INSERT INTO email_templates_registry (name, locale) VALUES
	('welcome',        'ar'),
	('welcome',        'en'),
	('reset-password', 'ar'),
	('reset-password', 'en'),
	('magic-link',     'ar'),
	('magic-link',     'en'),
	('verify-email',   'ar'),
	('verify-email',   'en')
ON CONFLICT (name, locale) DO NOTHING;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0202', '05', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS email_templates_registry;
-- DELETE FROM schema_migrations WHERE version = '0202';
-- COMMIT;
