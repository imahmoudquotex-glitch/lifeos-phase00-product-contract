# Phase 00 Decisions Log

> One row per decision. Append-only. Never edit a past row; add a new row that supersedes it and link the predecessor.

| ID | Date (UTC) | Decision | Rationale | Alternatives Rejected | Supersedes | Owner |
|---|---|---|---|---|---|---|
| D-001 | 2026-05-24 | Free-forever model with optional donations only | Aligns with privacy positioning; removes paywall from MVP | Freemium with paid AI; subscription tiers | — | Product |
| D-002 | 2026-05-24 | Desktop-first PWA, dark-only UI | Matches ICP; reduces UI surface for MVP | Mobile-first native; multi-theme | — | Product/Design |
| D-003 | 2026-05-24 | Postgres with RLS + FORCE RLS as the only multi-tenant boundary | Strongest known row-level boundary; tested via pgTAP | App-only enforcement; one DB per tenant | — | Backend/Security |
| D-004 | 2026-05-24 | Vault uses ZKE (client-side encryption); never ZKP | ZKE matches the actual implementation; ZKP is unrelated | Claiming "ZKP" in marketing copy | — | Security |
| D-005 | 2026-05-24 | Single `MVP_ALLOWED` source validated 1:1 against `mvp-scope.md` | Prevents drift between docs and runtime guard | Two independent lists; manual review only | — | DX |
| D-006 | 2026-05-24 | 15 MVP feature keys locked (auth, workspace, dashboard, pages, notes, tasks, habits, finance, goals, calendar, search, ai-gateway, vault, settings, pwa) | Smallest set that delivers the LifeOS promise | Adding billing / marketplace / mobile-native | — | Product |
| D-007 | 2026-05-24 | All packages namespaced `@lifeos/*` | Removes import ambiguity; CI enforces | Bare `packages/*` imports | — | DX |
| D-008 | 2026-05-24 | DB client interface fixed to `one/oneOrNone/many/none/tx` | Driver-independent surface; uniform error semantics | Direct `pg` / Prisma / Drizzle | — | Backend |
| D-009 | 2026-05-24 | API envelope = `{ ok, data, meta? }` or `{ ok:false, error:{code,message,metadata?} }` | One shape across all routes | Throwing raw errors; arbitrary JSON | — | Backend |
| D-010 | 2026-05-24 | Privacy claims gated behind implementation + test (`CLAIM_NOT_ALLOWED_YET`) | Prevents marketing-driven false claims | Aspirational copy in README/landing | — | Product/Security |
| D-011 | 2026-05-24 | `packages/ai` will be created in Phase 06; until then any direct AI SDK import is forbidden | Avoids accidental provider lock-in and vault leaks during early phases | Allowing temporary direct calls | — | AI/Security |
| D-012 | 2026-05-24 | Migration ranges revised post-implementation + Wxx notation retired + 100-slot policy locked from Phase 06+ | Phase 00 v1.2 promised ranges (0001–0099 / 0100–0199 / 0200–0299 / 0300–0399 / none) diverged from actual Phase 02..05 usage (0001–0118 / 0119–0147 / 0148–0199 / 0200–0299); ADR-0024 from Phase 05 retires `Wxx` and `wave/*`; future phases need a deterministic formula | (a) Keep inaccurate ranges in docs and let drift grow; (b) Renumber already-applied migrations | Partially supersedes D-006 phase notation; refines convention from D-007/D-008 | DX/Backend |

> New decisions after Phase 00 go to `docs/adr/NNNN-*.md` (using the ADR template at `docs/adr/template.md`).
