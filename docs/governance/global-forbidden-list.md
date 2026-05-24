# Global Forbidden List

CI must fail if any of these is violated.

- ❌ UUID/SERIAL/BIGSERIAL for business IDs.
- ❌ `SELECT *`.
- ❌ SQL in route handlers.
- ❌ `process.env.*` outside `@lifeos/shared/env`.
- ❌ `localStorage` for tokens/keys/vault.
- ❌ Floats for money.
- ❌ `new Date()` in business logic.
- ❌ `===` for HMAC; use timing-safe compare.
- ❌ Inline styles in UI.
- ❌ `light:` Tailwind classes or light surfaces.
- ❌ AI prompts containing vault content.
- ❌ Direct AI SDK outside `@lifeos/ai`.
- ❌ Stripe/Billing in MVP.
- ❌ Duplicate `AppError`/`ErrorCode`/`MVP_ALLOWED`.
- ❌ Caching authenticated responses in Service Worker.
- ❌ `unsafe-inline`, `unsafe-eval` in CSP.
- ❌ Renaming a Global Convention without an ADR.
- ❌ Marking a feature "shipped" without test + audit entry.
