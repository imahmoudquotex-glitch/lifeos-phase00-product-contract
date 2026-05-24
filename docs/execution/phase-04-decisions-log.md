# Phase 04 — Decisions Log

## D-048 — XChaCha20-Poly1305 for vault encryption (ADR 0018)

**Context**: Vault items contain sensitive secrets (passwords, API keys). Symmetric encryption is required at-rest.  
**Decision**: Use XChaCha20-Poly1305 from `@noble/ciphers/chacha`. 192-bit nonce eliminates nonce collision risk in client-side scenarios. AEAD provides ciphertext integrity.  
**Rejected**: AES-256-GCM (96-bit nonce too short for client use), ChaCha20 without Poly1305 (no integrity).  
**ADR**: 0018.

---

## D-049 — Argon2id for vault master key derivation (ADR 0018)

**Context**: User password must be stretched into a 32-byte cryptographic key. Must resist GPU/ASIC brute-force.  
**Decision**: Argon2id with OWASP 2024 minimum parameters: `m=65536 (64MB), t=3, p=1, dkLen=32`. Salt stored per-vault-item alongside ciphertext.  
**Rejected**: PBKDF2 (insufficiently memory-hard), scrypt (parameter-passing error-prone in browser), bcrypt (max 72-byte input limitation).  
**ADR**: 0018.

---

## D-050 — Envelope encryption pattern for vault items (ADR 0018)

**Context**: If a master key is compromised, all vault items encrypted with it are compromised. Need key isolation.  
**Decision**: Each vault item gets a random per-item key (item_key). item_key is encrypted with the workspace master key and stored alongside the ciphertext (the "envelope"). Re-keying only requires re-encrypting per-item keys, not all ciphertexts.  
**Trade-off**: Two crypto operations per vault write (encrypt item + wrap key). Acceptable — vault writes are rare relative to reads.  
**ADR**: 0018.

---

## D-051 — Audit chain with DB-stored hash (ADR 0019)

**Context**: audit_events table must be tamper-evident. A row deleted from the DB should be detectable.  
**Decision**: Each audit event stores `prev_hash` (SHA-256 of the previous event's hash + payload). The chain is stored in the DB (not in a separate append-only store) because our threat model is external attackers, not compromised DB admins. DB admins can break the chain, but that's acceptable — we log to external SIEM for compliance.  
**Rejected**: Blockchain-style external store (too complex for MVP), immutable DB (Neon doesn't support row-level immutability without triggers that can be dropped).  
**ADR**: 0019.

---

## D-052 — OAuth PKCE state token stored in DB (ADR 0020)

**Context**: OAuth state parameter must be validated on callback to prevent CSRF. State must survive browser redirects.  
**Decision**: Store `oauth_state_store` in DB (migration 0150) with HMAC-signed state token, 10-minute TTL, consumed-on-use. Cookie-based storage rejected because SameSite=Lax cookies are not sent on OAuth redirect in some browsers.  
**Rejected**: Cookie-based state (browser compatibility), in-memory state (does not survive server restart/multi-instance).  
**ADR**: 0020.

---

## D-053 — CSP strict-nonce via middleware (ADR 0021)

**Context**: Content Security Policy is the primary XSS mitigation. Script-src needs to be restrictive without breaking Next.js runtime scripts.  
**Decision**: Generate a per-request nonce in `apps/web/middleware.ts`, inject it into CSP header via `next/headers`, and set `script-src 'nonce-{nonce}' 'strict-dynamic'`. `strict-dynamic` propagates trust to scripts loaded by trusted scripts without allowlisting origins.  
**Rejected**: `unsafe-inline` (defeats CSP purpose), allowlist-based `script-src` (brittle, breaks on CDN changes).  
**ADR**: 0021.

---

## D-054 — Service Worker offline outbox with body hash (ADR 0022)

**Context**: Mutating requests (POST/PATCH/DELETE) made while offline must be queued and replayed when connectivity returns. Duplicate prevention needed (the server may have received the request before the connection dropped).  
**Decision**: Queue requests in IndexedDB outbox with SHA-256 hash of request body. On replay, server checks hash against `webhook_nonces`-style idempotency table. Body hash ensures the queued payload is not tampered with in IndexedDB.  
**Rejected**: Last-write-wins replay (data loss on conflict), no offline support (poor PWA experience).  
**ADR**: 0022.

---

## D-055 — Migration range 0148-0199 reserved for Phase 04 (ADR 0023)

**Context**: Migrations need predictable numbering to prevent conflicts in parallel branches.  
**Decision**: Phase 04 owns 0148–0199 (52 slots). Phase 04 used: 0148–0157 (10 migrations). Phase 05 starts at 0158 unless Phase 04 needs more slots.  
**ADR**: 0023.

---

## D-056 — withWorkspaceRoute missing at P04 lock [explicit gap]

**Context**: §2.3, §4.2, and all §5 route examples in the Phase 04 plan reference `withWorkspaceRoute` as the HTTP edge wrapper for all workspace-scoped API routes. At the P04 lock SHA, `packages/auth-guard/src/withWorkspaceRoute.ts` did not exist.  
**Decision**: Create `withWorkspaceRoute.ts` in `packages/auth-guard/src/` as part of P04 defect remediation. All 21 workspace-scoped routes should use it to guarantee:
1. `requireUser` enforced first
2. workspace non-membership → HTTP 404 (not 403) per ADR 0008
3. `withWorkspaceContext` injects RLS GUCs per ADR 0006
4. `role` available to capability checks without repetition  
**Action required in Phase 05**: Audit all 21 routes to confirm they use the wrapper (not ad-hoc requireUser + requireWorkspace calls).

---

## D-057 — E2E tests deferred to Phase 05 [explicit deferral]

**Context**: `tests/e2e/auth-flow.test.ts`, `tests/e2e/page-tree.test.ts`, `tests/e2e/workspace-isolation.test.ts` are stubs at P04 lock. They require a running HTTP server (Next.js + Postgres) which is not available in unit test CI.  
**Decision**: Move stubs to `tests/e2e/_pending/` and create real test skeletons (`describe.skip`) with detailed assertion comments. Full E2E wiring (Playwright or supertest + real DB) in Phase 05.  
**Action required in Phase 05**: Run `pnpm test:e2e` against a test Postgres instance using Neon branching (ADR 0006 DB context strategy).

---

## D-058 — apps/worker outbox consumer deferred to Phase 05 [explicit deferral]

**Context**: `apps/worker` has a 265B placeholder at P04 lock. The offline outbox (ADR 0022) requires a consumer that reads from the DB outbox, calls LLM providers, and handles dead-letter routing.  
**Decision**: Phase 04 creates the worker infrastructure (tsconfig, package.json, basic boot log). Actual outbox processing deferred to Phase 05 when all domain services are fully wired.  
**Action required in Phase 05**: Implement `processOutbox()` loop in worker with `FOR UPDATE SKIP LOCKED` pattern (ADR 0011 pattern, extended to outbox).
