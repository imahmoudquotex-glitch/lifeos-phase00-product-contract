# ADR-0021 — Strict CSP + Nonce Per Request

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

Content Security Policy is `strict-dynamic` + per-request nonce, no `unsafe-inline`:

```
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
style-src 'self' 'nonce-{NONCE}';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
report-uri /api/_csp-report;
```

## Implementation

- Nonce is generated per-request in `apps/web/middleware.ts` using `node:crypto.randomBytes(16).toString('base64url')`.
- Nonce is passed to Next.js via `x-csp-nonce` request header.
- CSP violations are logged to `csp_reports` table via `/api/_csp-report` endpoint.

## Consequences

- All `<script>` and `<style>` tags must carry the nonce attribute.
- Third-party scripts must use `strict-dynamic` propagation.
