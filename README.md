# LifeOS — Phase 00: Product Contract & MVP Scope Lock

> **Status:** 🔒 LOCKED — `phase-00-product-contract-locked`
> **Branch:** `phase/00-product-contract`
> **Tests:** ✅ 6/6 vitest passing

---

## What is this?

This repository contains **Phase 00** of the LifeOS project — the **product contract and global conventions** that govern all 60 subsequent build phases.

**No UI. No database. No AI. No billing.** Just the locked source of truth.

---

## LifeOS Vision

> Desktop-first workspace for planning, knowledge, focus, habits, finance, and safe AI — **private, fast, and free forever.**

---

## What's in Phase 00

```
docs/
├── execution/
│   ├── phase-00-understanding.md    ← What this phase does and doesn't do
│   ├── phase-00-checklist.md        ← Every item verified ✅
│   ├── phase-00-decisions-log.md    ← D-001 → D-012 architecture decisions
│   └── phase-00-outputs.md          ← Inter-phase contract for Phase 01
├── product/
│   ├── vision.md                    ← One-line vision + non-negotiables
│   ├── icp.md                       ← Ideal Customer Profile
│   ├── pains-and-jobs.md            ← User pains + jobs-to-be-done
│   ├── differentiators.md           ← vs Notion / Obsidian / Todoist
│   ├── mvp-scope.md                 ← 15 MVP features (locked, 1:1 with script)
│   ├── out-of-scope.md              ← What we will NOT build before launch
│   ├── success-metrics.md           ← Activation, retention, privacy, performance KPIs
│   ├── free-forever-model.md        ← Free for all, donations only
│   ├── risk-register.md             ← RISK-001 → RISK-011 (all P0/P1 covered)
│   ├── launch-criteria.md           ← Hard gates before going live
│   └── roadmap.md                   ← 60-phase map with branch/tag conventions
├── governance/
│   ├── global-conventions.md        ← THE single source of truth (22 sections)
│   ├── global-forbidden-list.md     ← CI-enforced forbidden patterns
│   ├── scope-gate.md                ← PR checklist for every new feature
│   ├── privacy-claims-policy.md     ← No claim without implementation + test
│   └── ai-execution-rules.md        ← Rules for AI code generation
└── adr/
    └── template.md                  ← Architecture Decision Record template

scripts/
├── check-mvp-scope.ts               ← Runtime MVP gate (CLI + importable)
└── __tests__/
    └── check-mvp-scope.test.ts      ← 6 tests, strict 1:1 alignment

vitest.config.ts
```

---

## MVP Features (15 — locked)

| Feature | Phase |
|---|---|
| `auth` | phase/02 → phase/05 |
| `workspace` | phase/02 |
| `dashboard` | phase/06 |
| `pages` | phase/02 → phase/09 |
| `notes` | phase/03 → phase/10 |
| `tasks` | phase/03 → phase/11 |
| `habits` | phase/03 → phase/13 |
| `finance` | phase/03 → phase/14 |
| `goals` | phase/15 |
| `calendar` | phase/03 → phase/16 |
| `search` | phase/37 |
| `ai-gateway` | phase/06 |
| `vault` | phase/04 |
| `settings` | phase/05 |
| `pwa` | phase/04 |

---

## Key Decisions (D-001 → D-012)

| ID | Decision |
|---|---|
| D-001 | Free-forever model, donations only — no paywall ever |
| D-002 | Desktop-first PWA, dark-only interface |
| D-003 | Postgres RLS + FORCE RLS as the only multi-tenant boundary |
| D-004 | Vault uses ZKE (client-side encryption) — never ZKP |
| D-005 | Single `MVP_ALLOWED` set, validated 1:1 against `mvp-scope.md` |
| D-006 | 15 MVP feature keys locked |
| D-007 | All packages namespaced `@lifeos/*` |
| D-008 | DB client interface: `one / oneOrNone / many / none / tx` |
| D-009 | API envelope: `{ ok, data, meta? }` or `{ ok:false, error:{...} }` |
| D-010 | Privacy claims require implementation + test (`CLAIM_NOT_ALLOWED_YET`) |
| D-011 | `@lifeos/ai` created in Phase 06 — no direct AI SDK before then |
| D-012 | Migration ranges revised; 100-slot policy from Phase 06+ |

---

## Running the MVP Scope Gate

```bash
pnpm install
# Check if a feature is in MVP:
pnpm tsx scripts/check-mvp-scope.ts auth        # → OK
pnpm tsx scripts/check-mvp-scope.ts billing     # → POST_MVP_FEATURE (exit 1)

# Run alignment tests:
pnpm test
# Output: 6 passed (6)
```

---

## Global Conventions (summary)

Defined in [`docs/governance/global-conventions.md`](docs/governance/global-conventions.md) — 22 sections covering:

- **Runtime:** Node ≥20.11, pnpm ≥9, ESM, TypeScript strict
- **IDs:** ULID (`id TEXT PRIMARY KEY`) — no UUID/SERIAL
- **Money:** `*_cents BIGINT` — no floats
- **Time:** TIMESTAMPTZ UTC only
- **Errors:** `AppError / ErrorCode / Result` in `@lifeos/shared/errors` only
- **API:** Unified envelope for all routes
- **DB:** Interface-based client, no raw SQL in handlers
- **RLS:** ENABLE + FORCE on every tenant table
- **AI:** Only via `@lifeos/ai` gateway (Phase 06+)
- **Vault:** ZKE — plaintext never in logs/prompts/cache
- **Branches:** `phase/NN-short-name` | **Tags:** `phase-NN-locked`

---

## Risks (RISK-001 → RISK-011)

All 11 risks documented with Severity, Likelihood, Mitigation, and Owner.
P0 risks: RLS bypass, AI sees vault, auth token leakage, SW cache leak, OAuth replay, crypto drift.
P1 risks: Feature creep, infra cost, vendor lock-in, performance degradation, duplicate source of truth.

---

## Lock

```
git tag: phase-00-product-contract-locked (annotated)
Commit:  ab3e30b
Date:    2026-05-24
```

Phase 01 (Architecture Contracts & Naming Freeze) may begin after:
```bash
git tag --list | grep -x phase-00-product-contract-locked  # must exit 0
test -f docs/execution/phase-00-outputs.md                  # must exit 0
```

---

## License

AGPL-3.0-only
