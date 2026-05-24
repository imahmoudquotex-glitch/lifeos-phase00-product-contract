# ADR-0028 — Bi-Lingual Email Strategy (ar + en, ICU + MJML)

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

LifeOS serves Arabic-speaking users as primary audience. All transactional emails must be delivered in the user's preferred language (ar or en).

## Decision

**Template format:** MJML (compiled to HTML) with ICU MessageFormat variable injection.

**Per-locale files:** `{templateName}.{locale}.mjml` (e.g. `welcome.ar.mjml`, `welcome.en.mjml`)

**Supported locales:** `ar`, `en` — explicit whitelist in `SupportedLocale` type (migration 0200).

**Subject extraction:** MJML files contain `<!-- subject: {ICU template} -->` comment in line 1.

**Template types (Phase 05):**
- `welcome` — new account welcome  
- `reset-password` — password reset link (60 min TTL)  
- `magic-link` — passwordless signin (15 min TTL)  
- `verify-email` — email verification (24h TTL)

**Render pipeline:**
```
renderEmail(name, locale, vars)
  → read {name}.{locale}.mjml
  → extract subject from <!-- subject: ... --> comment
  → format ICU vars into MJML source
  → mjml2html(strict)
  → { subject, html }
```

## Consequences

- Adding a new locale requires: (a) new MJML files, (b) new migration entry in email_templates_registry, (c) add to SupportedLocale type
- ICU format supports plurals, gender, selects — not just simple variable substitution
- MJML strict validation ensures valid HTML email output
- Locale preference stored in `users.locale` column (migration 0200), defaults to 'en'
