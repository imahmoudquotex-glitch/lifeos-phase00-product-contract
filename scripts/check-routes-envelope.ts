#!/usr/bin/env tsx
// check-routes-envelope.ts — PLACEHOLDER (activates Phase 02)
//
// Will enforce:
// - Every route.ts file in apps that returns Response.json() uses envelopeOk or envelopeErr.
// - Raw { ok: ... } literals in route handlers are forbidden.
//
// Phase 01 has only /api/health which correctly uses envelopeOk. Full scan activates Phase 02.
console.error('[check-routes-envelope] PLACEHOLDER — activates Phase 02. OK');
