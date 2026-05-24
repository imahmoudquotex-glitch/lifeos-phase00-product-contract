# Phase 00 — Product Contract & MVP Scope Lock (Audited V1.2)

<aside>
🎯

**هدف المرحلة:** تثبيت تعريف المنتج + Global Conventions + Risks + Roadmap قبل أي كود. ممنوع UI / DB / AI / Billing قبل اكتمال هذه المرحلة. كل المراحل من 01 إلى 60 ستقرأ من ملفات هذه المرحلة كمصدر وحيد.

</aside>

<aside>
🤖

**رسالة للـ AI Executor:** نفّذ Steps 1 → 25 بالترتيب الحرفي. لا تخمن، لا تغيّر ترتيب، لا تدمج خطوات. عند أي تعارض بين هذه الصفحة وأي مستند آخر → هذه الصفحة تفوز. بعد Step 25 وقبل البدء في Phase 01 يجب أن يكون git tag `phase-00-product-contract-locked` موجوداً ومدفوعاً و `docs/execution/phase-00-outputs.md` مكتوباً.

</aside>

## 1. ملخص المرحلة

Phase 00 = الدستور + الـ Global Conventions. الناتج النهائي:

- 3 ملفات `docs/execution/` (understanding + checklist + decisions log).
- 11 ملف `docs/product/` (vision, icp, pains-and-jobs, differentiators, mvp-scope, out-of-scope, success-metrics, free-forever-model, risk-register, launch-criteria, roadmap).
- 5 ملفات `docs/governance/` (scope-gate, privacy-claims-policy, ai-execution-rules, global-conventions, global-forbidden-list).
- 1 ملف `docs/adr/template.md` للقرارات المعمارية اللاحقة.
- 1 سكريبت + 1 اختبار في `scripts/`.
- git tag سنوي `phase-00-product-contract-locked`.

## 2. بوابة البدء (Preflight)

📌 **قبل أي ملف:**

- [ ]  افتح branch: `phase/00-product-contract` (التسمية الموحدة لكل الـ 60 مرحلة: `phase/NN-short-name`).
- [ ]  لا يوجد UI ولا migrations ولا AI provider ولا billing.
- [ ]  لا يوجد secret في Notion أو Git.
- [ ]  اكتب `docs/execution/phase-00-understanding.md` أولاً.

⚠️ **ملاحظة تبعية:** اختبارات Phase 00 (Step 20) تحتاج vitest. أنشئ أولاً `vitest.config.ts` في Step 21 (حتى تعمل الاختبارات فورياً). لا تعتمد على Phase 01 لإنشائه.

## 3. خريطة الملفات النهائية

```
docs/
├── execution/
│   ├── phase-00-understanding.md
│   ├── phase-00-checklist.md
│   ├── phase-00-decisions-log.md
│   └── phase-00-outputs.md         ← V1.2: Inter-phase contract for Phase 01
├── product/
│   ├── vision.md
│   ├── icp.md
│   ├── pains-and-jobs.md
│   ├── differentiators.md
│   ├── mvp-scope.md
│   ├── out-of-scope.md
│   ├── success-metrics.md
│   ├── free-forever-model.md
│   ├── risk-register.md
│   ├── launch-criteria.md
│   └── roadmap.md
├── adr/
│   └── template.md
└── governance/
    ├── scope-gate.md
    ├── privacy-claims-policy.md
    ├── ai-execution-rules.md
    ├── global-conventions.md
    └── global-forbidden-list.md
vitest.config.ts                    ← V1.2: needed by Step 20 test
scripts/
├── check-mvp-scope.ts
└── __tests__/
    └── check-mvp-scope.test.ts
```

## 4. أوامر الإنشاء من الصفر (انسخها كما هي)

```bash
mkdir -p docs/execution docs/product docs/governance docs/adr
mkdir -p scripts scripts/__tests__

touch docs/execution/phase-00-understanding.md
touch docs/execution/phase-00-checklist.md
touch docs/execution/phase-00-decisions-log.md

touch docs/product/vision.md
touch docs/product/icp.md
touch docs/product/pains-and-jobs.md
touch docs/product/differentiators.md
touch docs/product/mvp-scope.md
touch docs/product/out-of-scope.md
touch docs/product/success-metrics.md
touch docs/product/free-forever-model.md
touch docs/product/risk-register.md
touch docs/product/launch-criteria.md
touch docs/product/roadmap.md

touch docs/adr/template.md

touch docs/governance/scope-gate.md
touch docs/governance/privacy-claims-policy.md
touch docs/governance/ai-execution-rules.md
touch docs/governance/global-conventions.md
touch docs/governance/global-forbidden-list.md

touch scripts/check-mvp-scope.ts
touch scripts/__tests__/check-mvp-scope.test.ts

touch vitest.config.ts
touch docs/execution/phase-00-outputs.md
```

## 5. ترتيب التنفيذ الإجباري (Steps 1 → 25 خطي)

### Step 1 — `docs/execution/phase-00-understanding.md`

```markdown
# Phase 00 Understanding

## Goal
Lock product definition and Global Conventions before code.

## Must Not Do
- Do not build UI.
- Do not create database schema.
- Do not add AI provider calls (`packages/ai` is created later in Phase 06).
- Do not add billing or paywall.
- Do not add features outside MVP.

## Required Output
- 11 product docs.
- 5 governance docs (incl. global conventions + forbidden list).
- 1 ADR template.
- 1 roadmap covering Phases 01 → 60.
- MVP scope script + alignment test.
- Risk register with RISK-001 … RISK-011.
- Launch criteria with explicit blockers.
- git tag `phase-00-product-contract-locked`.
```

### Step 2 — `docs/product/vision.md`

```markdown
# Vision

## One-line Vision
LifeOS desktop-first workspace for planning, knowledge, focus, habits, finance, and safe AI — private, fast, and free forever.

## Core Promise
The user can capture, plan, review, and protect personal/work knowledge with minimum friction and maximum privacy.

## Non-negotiables
1. Desktop-first PWA.
2. Dark-only interface.
3. Multi-tenant isolation (Postgres RLS + FORCE RLS).
4. ZKE (Zero-Knowledge Encryption) vault — NOT ZKP.
5. No feature paywall; donations only.
6. AI never touches vault / high-sensitivity content.
7. Every feature must serve MVP or move to Post-MVP.
8. Every privacy/security claim must be backed by implementation + test before publication.
```

### Step 3 — `docs/product/icp.md`

```markdown
# ICP

## Primary ICP
Power user / founder / student / engineer who currently uses Notion + Todoist + Obsidian + habit tracker + focus app.

## Secondary ICP
Researcher or creator who needs a private knowledge and planning system.

## Served Workflows
- Personal knowledge management.
- Tasks and planning.
- Daily dashboard.
- Habits.
- Finance tracking.
- Private vault.
- Safe AI assistance.

## Not Served Yet
- Enterprise admin suite.
- Native mobile-first experience.
- Public community network.
- Paid team billing.
- Marketplace.
```

### Step 4 — `docs/product/pains-and-jobs.md`

```markdown
# Pains and Jobs To Be Done

## Main Pains
1. Too many tools for life/work planning.
2. Weak privacy in AI-enabled tools.
3. Poor daily dashboard experience.
4. Friction when capturing ideas/tasks.
5. No single trusted private vault.

## Jobs To Be Done
- Capture a thought in seconds.
- Convert thoughts into tasks.
- Review daily focus.
- Track habits and money.
- Store sensitive data safely.
- Use AI only where safe.
```

### Step 5 — `docs/product/differentiators.md`

```markdown
# Differentiators

## Against Notion
- Desktop-first command center.
- Stronger privacy boundary (E2EE vault).
- Free forever without feature gates.
- AI safety perimeter from day one.

## Against Obsidian
- Built-in tasks, habits, finance, dashboard.
- Multi-tenant web/PWA app.
- Safer AI gateway with sensitivity levels.

## Against Todoist / Habit trackers
- Unified LifeOS instead of single-purpose tracking.
```

### Step 6 — `docs/product/mvp-scope.md` (15 صف 1:1 مع `MVP_ALLOWED`)

```markdown
# MVP Scope

> **Phase column notation (binding, post-ADR-0024 / D-012):**
> - `phase/NN` = the single phase that introduces the feature.
> - `phase/NN → phase/MM` = `Start: phase/NN | End: phase/MM` (feature introduced in phase NN and extended/polished in phase MM).
> - The old `Wxx` / `Wxx/Wyy` notation is **deprecated** by ADR-0024 (Phase 05). All branches use `phase/NN-name`, all exit tags use `phase-NN-locked`.
> - Every feature key in this table MUST appear exactly once in `scripts/check-mvp-scope.ts` `MVP_ALLOWED`, and vice versa. The CI test `MVP docs and script stay aligned` enforces strict 1:1 mapping (no aliases, no merging).

| Feature key | Why it exists | Metric | Phase (Start → End) |
|---|---|---|---|
| auth | User can safely enter the app | activation_d1_pct | phase/02 → phase/05 |
| workspace | Multi-tenant isolation | activation_d1_pct | phase/02 |
| dashboard | Daily command center | retention_w1_pct | phase/06 |
| pages | User can create knowledge | activation_d1_pct | phase/02 → phase/09 |
| notes | User can capture ideas | activation_d1_pct | phase/03 → phase/10 |
| tasks | User can plan their day | retention_w1_pct | phase/03 → phase/11 |
| habits | User returns daily | retention_w1_pct | phase/03 → phase/13 |
| finance | Personal LifeOS completeness | retention_m1_pct | phase/03 → phase/14 |
| goals | User can set and track outcomes | retention_m1_pct | phase/15 |
| calendar | User can manage time-bound items | retention_w1_pct | phase/03 → phase/16 |
| search | Fast retrieval | retention_w1_pct | phase/37 |
| ai-gateway | Safe AI usage | ai_safety_violations | phase/06 |
| vault | Privacy differentiator | vault_adoption_pct | phase/04 |
| settings | User controls account/security | activation_d1_pct | phase/05 |
| pwa | Desktop app feel | retention_w1_pct | phase/04 |
```

📌 **القاعدة:** أي صف هنا = key واحد فقط في `MVP_ALLOWED`. ممنوع دمج features (لا `auth+workspace`). ممنوع aliases.

📌 **ملاحظة CI:** اختبار `MVP docs and script stay aligned` يقرأ فقط العمود الأول (Feature key) — تغيير عمود `Phase` من `Wxx` إلى `phase/NN` لا يكسر الاختبار، لكن أي تعديل لقيمة في عمود Feature key يجب أن يصاحبه تعديل مطابق في `MVP_ALLOWED`.

### Step 7 — `docs/product/out-of-scope.md`

```markdown
# Out of Scope Before MVP Launch

| Item | Reason | Future Phase |
|---|---|---|
| Native mobile app | Desktop-first constraint | Post-MVP |
| Billing/paywall | Product is free forever | never (donations only) |
| Public marketplace | Increases moderation/security scope | Post-MVP |
| Enterprise SSO | Not needed for ICP | Post-MVP |
| Public community network | Not part of core LifeOS | Post-MVP |
| Full marketing site | Not needed for core validation | W11 |
```

### Step 8 — `docs/product/success-metrics.md`

```markdown
# Success Metrics

## Activation
- activation_d1_pct ≥ 45%.

## Retention
- retention_w1_pct ≥ 25%.
- retention_m1_pct ≥ 15%.

## Privacy
- vault_adoption_pct ≥ 30%.
- ai_vault_leak_count = 0 (hard gate).
- ai_safety_violations = 0 (hard gate).

## Performance
- p95_api_latency_ms ≤ 200.
- DB p95 ≤ 50ms.
- TTI cached < 2s.
- TTI cold < 4s.

## Donations
- donations_conversion_pct is measured only.
- No donation feature gate is allowed.
```

### Step 9 — `docs/product/free-forever-model.md`

```markdown
# Free Forever Model

## Rule
All product features are free for all users.

## Donations
Donations are optional and must not unlock functionality.

## Allowed Donation Benefits
- Thank-you badge.
- Supporter mention if user opts in.
- Receipt email.

## Forbidden
- Paywalled AI.
- Paywalled vault.
- Paywalled export.
- Paywalled collaboration.
- Paywalled privacy.
```

### Step 10 — `docs/product/risk-register.md` (RISK-001 … RISK-011)

```markdown
# Risk Register

## RISK-001 — RLS bypass
- Category: Security
- Severity: P0
- Likelihood: Medium
- Impact: Cross-tenant data leak.
- Mitigation: RLS + FORCE RLS + pgTAP + tenant fuzzer (Phase 02).
- Owner: Security/Backend
- Status: Open

## RISK-002 — AI sees vault content
- Category: Privacy
- Severity: P0
- Likelihood: Medium
- Impact: Private data leak via AI provider.
- Mitigation: Sensitivity levels + vault guard + CI scan (Phase 04 + Phase 06).
- Owner: AI/Security
- Status: Open

## RISK-003 — Feature creep
- Category: Product
- Severity: P1
- Likelihood: High
- Impact: MVP never ships.
- Mitigation: Scope gate + `MVP_ALLOWED` + CI alignment test (this phase).
- Owner: Product
- Status: Open

## RISK-004 — Infrastructure cost outgrows donations
- Category: Sustainability
- Severity: P1
- Likelihood: Medium
- Impact: Free-forever promise breaks; service degrades or shuts down.
- Mitigation: Cost dashboard, per-workspace soft quotas, opt-in usage caps for AI tokens; reviewed quarterly; documented in `free-forever-model.md`.
- Owner: Product/Infra
- Status: Open

## RISK-005 — Vendor / provider lock-in
- Category: Engineering
- Severity: P1
- Likelihood: Medium
- Impact: Forced migration with downtime or data loss.
- Mitigation: Single DbClient interface (`@lifeos/db`) over `postgres`; AI behind `@lifeos/ai` gateway; storage behind `@lifeos/storage`; email behind `@lifeos/email`. Every provider needs ≥1 stub adapter to prove the abstraction.
- Owner: Backend
- Status: Open

## RISK-006 — Performance degradation as data grows
- Category: Performance
- Severity: P1
- Likelihood: High
- Impact: p95 latency breaches success-metric thresholds.
- Mitigation: Mandatory indexes per repo, `EXPLAIN ANALYZE` regression test in Phase 03, per-table row-count alerts, archival policy for `audit_events` / `ai_usage_events` / `idempotency_keys` (Phase 04+).
- Owner: Backend
- Status: Open

## RISK-007 — Auth token leakage in PWA offline mode
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Account takeover on shared device.
- Mitigation: Cookies httpOnly + Secure + SameSite=Strict; tokens never in IndexedDB / localStorage / SW cache; SW deny-list includes `/api/auth/*`; offline guard refuses authenticated cache; tests in Phase 04.
- Owner: Security/Frontend
- Status: Open

## RISK-008 — Service Worker caches authenticated content
- Category: Privacy
- Severity: P0
- Likelihood: Low
- Impact: Cross-user leak on shared device.
- Mitigation: SW deny-list + Set-Cookie short-circuit + tests (Phase 04).
- Owner: Frontend
- Status: Open

## RISK-009 — Open redirect / OAuth state replay
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Account takeover via crafted OAuth callback.
- Mitigation: `safeRedirectPath` + signed OAuth state with nonce + replay store (Phase 04/05).
- Owner: Security
- Status: Open

## RISK-010 — Crypto algorithm drift / weak vault
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Vault data becomes unrecoverable or weakly protected.
- Mitigation: Pinned `@noble/ciphers`, version locked, single envelope format (Phase 04).
- Owner: Security
- Status: Open

## RISK-011 — Duplicate source of truth (errors, MVP list, conventions)
- Category: Engineering
- Severity: P1
- Likelihood: High
- Impact: Drift between modules, untraceable bugs.
- Mitigation: CI guards `check-no-duplicate-app-error.ts` + alignment test for `MVP_ALLOWED`; one global-conventions file as SoT.
- Owner: DX
- Status: Open
```

### Step 11 — `docs/product/launch-criteria.md`

```markdown
# Launch Criteria

## Launch Allowed When
- 0 P0/P1 bugs.
- RLS tests 100% pass.
- AI safety violations = 0.
- Vault plaintext leak tests pass.
- WCAG audit passes (axe serious/critical = 0).
- PWA installability passes.
- Backup/restore drill succeeds.
- CSP report-only ran 2 weeks without critical violations.

## Launch Blocked When
- Any cross-tenant leak exists.
- Any vault plaintext reaches logs/AI/cache.
- Any critical auth bug exists.
- Any required MVP flow is broken.
- Any privacy claim is not backed by implementation + test.
```

### Step 12 — `docs/product/roadmap.md` (60-phase map)

```markdown
# LifeOS Roadmap — 60-Phase High-Level Map

> Phase 00 is the contract. Phases 01 → 60 implement it. Each phase has its own page; this file is the table of contents and the ordering constraint.

| Wave | Phases | Theme | Outcome |
|---|---|---|---|
| W00 | 01 | Architecture Contracts & Naming Freeze | Monorepo, shared packages, DB client interface, CI guards. |
| W01 | 02 | Kernel: Workspace, Profile, Pages | Auth tables, workspace, RLS, page tree. |
| W02 | 03 | Data Plane: Tasks, Notes, Habits, Expenses, Calendar, Vault, AI Quota | All tenant tables + repos + services. |
| W03 | 04 | Security Fortress & Offline PWA | Vault crypto, CSP, SW, audit chain, push, redaction. |
| W04 | 05 | Zenith Integration & Auth UI | Design system import, login/signup/onboarding/settings UIs. |
| W05 | 06–08 | AI Gateway, Search, Dashboard | `@lifeos/ai` provider abstraction + sensitivity guard, FTS, daily dashboard. |
| W06 | 09–12 | Page Editor, Notes Editor, Task Views | Rich-text editor, inline AI, kanban/list/calendar. |
| W07 | 13–15 | Habits UX, Finance UX, Goals UX | Streak engine, expense flows, goal tracking. |
| W08 | 16–18 | Calendar, Reminders, Notifications | Time-bound items, push, email digests. |
| W09 | 19–21 | Vault UX, Sharing, Permissions UX | Vault unlock flow, capability-based sharing UI. |
| W10 | 22–24 | Responsive polish, Accessibility | Touch targets, WCAG audit, keyboard nav. |
| W11 | 25–27 | Landing, Marketing, Donations | Public site, donations widget (no feature unlock). |
| W12 | 28–30 | Performance, Caching, CDN | Edge cache, image pipeline, query budgets. |
| W13 | 31–33 | Observability, SLOs, Alerts | Metrics, traces, error budgets. |
| W14 | 34–36 | Backup, Restore, DR Drills | Daily backups, restore drills, runbooks. |
| W15 | 37–39 | Advanced Search, AI Memory, Embeddings | Vector index behind AI gateway. |
| W16 | 40–42 | Plugins API (read-only), Webhooks | External integrations on safe surface. |
| W17 | 43–45 | Import/Export, Migration Tools | Notion/Obsidian import; full data export. |
| W18 | 46–48 | Collaboration: Comments, Mentions, Presence | Real-time presence behind permission guard. |
| W19 | 49–51 | Workspaces v2: Teams, Roles | Team capability matrix on top of resolver. |
| W20 | 52–54 | Privacy Audits, Pentests, Bug Bounty | External audits + remediation. |
| W21 | 55–57 | Localization, i18n, RTL | Arabic, English, Hebrew, Persian first. |
| W22 | 58–60 | Launch Readiness, GA, Post-launch hardening | Final blockers, GA, post-launch monitoring. |

> **Binding rules (apply uniformly to all 60 phases):**
> - Phases are sequential. No phase starts before the previous phase's exit tag exists.
> - **Branch convention** for every phase: `phase/NN-short-name`. Examples: `phase/00-product-contract`, `phase/01-architecture`, `phase/02-kernel`, `phase/03-data-plane`, `phase/04-security`, `phase/05-zenith-ui`, …, `phase/60-ga`.
> - **Exit tag convention** for every phase: annotated git tag `phase-NN-locked`. Phase 00 uses the longer historical form `phase-00-product-contract-locked`. From Phase 01 onward use `phase-01-locked`, `phase-02-locked`, …, `phase-60-locked`. The old `wXX-frozen` scheme is **deprecated** and replaced by this convention.
> - **Inter-phase contract:** Each phase MUST end with `docs/execution/phase-NN-outputs.md` declaring its guaranteed outputs (files, packages, env vars, migrations, scripts, ADRs) that the next phase may rely on.
> - Any phase that depends on a not-yet-built capability MUST stub it locally and document the stub on that phase's page.
> - Adding/removing a phase requires an ADR and an updated row here in the same PR.
```

### Step 13 — `docs/adr/template.md`

```markdown
# ADR NNNN — <Short title>

- Status: Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
- Date: YYYY-MM-DD
- Owner: <team or person>
- Supersedes: —

## Context
What problem are we deciding about? What constraints apply?

## Decision
The single decision in one paragraph. No alternatives here.

## Alternatives Considered
- Option A — why rejected.
- Option B — why rejected.

## Consequences
- Positive consequences.
- Negative consequences / tradeoffs.
- CI/test enforcement (if any).

## Links
- Related ADRs.
- Related phase pages.
- Related code paths.
```

📌 **قاعدة:** كل قرار معماري لاحق ينسخ هذا الـ template ويُسمى `docs/adr/<NNNN>-<kebab-title>.md`، بترقيم متتالٍ بدءاً من Phase 01.

### Step 14 — `docs/governance/scope-gate.md`

```markdown
# Scope Gate

Before adding any feature, answer these in the PR description:
1. Is it in MVP scope? (link to mvp-scope.md row)
2. Which metric does it improve?
3. Which phase owns it?
4. Does it risk privacy/security?
5. Is it required before launch?

If any answer is unclear, move it to Post-MVP.
```

### Step 15 — `docs/governance/privacy-claims-policy.md`

```markdown
# Privacy Claims Policy

## Rule
Never claim privacy/security unless implementation exists AND a test exists.

## Forbidden Claims Until Implemented
- "Zero-knowledge" without client-side encryption + test.
- "AI cannot see data" without AI gateway guard + test.
- "No logs contain sensitive data" without redaction tests.
- "Secure by default" without CI security checks.

## Required Label for Unimplemented Claims
CLAIM_NOT_ALLOWED_YET

## Glossary
- ZKE = Zero-Knowledge Encryption (data encrypted client-side; server cannot read). ✅ What LifeOS implements.
- ZKP = Zero-Knowledge Proofs (cryptographic proofs). ❌ NOT what LifeOS does. Never write "ZKP" in product copy.
```

### Step 16 — `docs/governance/ai-execution-rules.md`

```markdown
# AI Execution Rules

## Required Behavior
- Read the phase page top-to-bottom before code.
- Follow file paths exactly.
- Do not invent new architecture.
- Do not add features outside MVP.
- Stop on missing secrets; ask the owner.
- Use stubs for optional providers (donations, email, captcha).
- Never write secrets to docs/Notion/Git.
- After each step run CI scripts locally.

## Forbidden Behavior
- Direct AI provider calls outside `@lifeos/ai` (note: `@lifeos/ai` will be created in Phase 06; until then any import of `openai` / `@anthropic-ai/sdk` / `@google/generative-ai` in any package is forbidden and `scripts/check-no-ai-direct-provider.ts` MUST fail CI on it).
- Vault content in prompts.
- SQL in route handlers.
- UI before design approval.
- Feature creep.
- Renaming a Global Convention without an ADR.
```

### Step 17 — `docs/governance/global-conventions.md` (SoT لكل المراحل)

```markdown
# Global Conventions — Single Source of Truth

All phases (01 → 60) MUST follow this file exactly. Any contradiction = this file wins.

## 1. Runtime
- Node 20.11.0 (`.nvmrc`).
- pnpm 9.0.0.
- ESM only (`"type": "module"`).
- TypeScript strict + ES2022 + Bundler resolution.
- Test runner: vitest. Lint: eslint flat. Format: prettier. Build: turbo.

## 2. Package scope
- Every package in `packages/<dir>` is named `@lifeos/<dir>`.
- Every app in `apps/<dir>` is named `@lifeos/app-<dir>`.
- Imports MUST use `@lifeos/<name>`. Relative paths to other packages are forbidden.

## 3. Identifiers
- `id TEXT PRIMARY KEY` for every business table.
- ULID, app-generated via `@lifeos/shared/ids/newUlid()`.
- Forbidden in business tables: UUID, SERIAL, BIGSERIAL.

## 4. Money
- `*_cents BIGINT` for every amount column.
- `currency CHAR(3)`.
- Rates as INTEGER basis points (1250 = 12.50%).
- Forbidden: NUMERIC, DECIMAL, FLOAT, REAL, DOUBLE PRECISION on business tables.

## 5. Time
- Every datetime = TIMESTAMPTZ in UTC.
- Forbidden `new Date()` in business logic; use `Clock` from `@lifeos/shared/time`.

## 6. Errors
- `AppError`, `ErrorCode`, `Result`, `ok`, `err`, `isOk`, `isErr` live in `@lifeos/shared/errors` only.
- ErrorCode format: `<DOMAIN>_<REASON>` UPPER_SNAKE.

## 7. API envelope
- Success: `{ ok: true, data: T, meta?: object }`.
- Failure: `{ ok: false, error: { code: string, message: string, metadata?: object } }`.

## 8. Route wrappers (from `@lifeos/route`)
- `withApiErrorHandling`, `withUserRoute`, `withWorkspaceRoute`, `parseJsonBody(req, ZodSchema)`, `requireIdempotencyKey(req)`.

## 9. DB client contract
```

interface DbClient {

one<T>(sql, params?): Promise<T>;

oneOrNone<T>(sql, params?): Promise<T | null>;

many<T>(sql, params?): Promise<T[]>;

none(sql, params?): Promise<void>;

tx<T>(fn): Promise<T>;

}

```jsx
Implementation lives in `@lifeos/db` over `postgres`. Forbidden to import `pg` / `pg-promise` / `prisma` elsewhere.

## 10. Workspace context
- `withWorkspaceContext(db, { userId, workspaceId }, fn)` sets `set_config('app.current_user_id', $1, true)` and `set_config('app.current_workspace_id', $1, true)` per transaction.
- Forbidden to query a tenant table outside `withWorkspaceContext`.

## 11. Migrations
- Filename `^\d{4}__[a-z0-9_]+\.sql$`.
- BEGIN/COMMIT + idempotent operators required.
- **Migration ranges (revised post-implementation — D-012):** Phase 01 introduces no migrations (architecture-only). Phase 02 = 0001–0118. Phase 03 = 0119–0147. Phase 04 = 0148–0199 (used 0148–0157). Phase 05 = 0200–0299 (used 0200–0204). **From Phase 06 onward, every phase reserves a strict 100-slot range:** Phase NN range = `((NN−6)×100 + 300) .. ((NN−6)×100 + 399)`. Examples: Phase 06 = 0300–0399, Phase 07 = 0400–0499, …, Phase 60 = 5700–5799. The migration runner (`scripts/migrate.ts`) MUST validate that any migration file with prefix outside the active phase's reserved range fails CI. The earlier promise of `0001–0099/0100–0199/0200–0299/0300–0399/none` is superseded by this rule.

## 12. RLS
- ENABLE + FORCE on every tenant table.
- One policy `<table>_isolation`.
- pgTAP test per policy.

## 13. SQL location
- SQL is forbidden in route handlers.
- All queries live in `*.repo.ts`.
- `SELECT *` is forbidden.

## 14. Permissions
- All decisions through `@lifeos/permissions/resolver.assertCapability`.

## 15. AI calls
- Only inside `@lifeos/ai` (created in Phase 06).

## 16. Vault
- Plaintext forbidden in AI prompts / logs / IndexedDB / SW cache / error metadata / audit payloads.
- Crosses boundary only via `@lifeos/vault-crypto`.

## 17. Secrets
- `process.env.X` forbidden outside `@lifeos/shared/env`.

## 18. Naming
Tables snake_case plural; columns snake_case; indexes `idx_<table>_<cols>`; PK/FK/UQ/CHK named; TS types PascalCase; vars camelCase; constants UPPER_SNAKE; files kebab-case; routes `/api/v1/<plural>`; error codes `<DOMAIN>_<REASON>`.

## 19. Branches & Tags (cross-phase consistency)
- **Branch per phase:** `phase/NN-short-name`. Created at the start of the phase, deleted after merge.
- **Exit tag per phase:** annotated git tag `phase-NN-locked` created at end of phase (Phase 00 uses `phase-00-product-contract-locked`).
- **Tag command (binding):** `git tag -a phase-NN-locked -m "<summary>"; git push origin phase-NN-locked`.
- **Preflight gate of phase NN+1:** `git tag --list | grep -x phase-NN-locked` (or `phase-00-product-contract-locked` for Phase 01) MUST exit 0.
- **Forbidden:** lightweight tags (`git tag <name>` without `-a`), tag deletion after push, retroactive re-tagging.

## 20. Inter-phase output contract
Every phase MUST end with `docs/execution/phase-NN-outputs.md` containing (template in Step 24 of Phase 00):
1. Guaranteed files / packages / scripts produced.
2. Guaranteed git tag(s) created.
3. Guaranteed env vars introduced (referencing `.env.example`).
4. Guaranteed migration range used (if any).
5. Stubs left behind that the next phase must replace.
6. Open risks carried forward.

## 21. Secrets management protocol (binding from Phase 01 onward)
- **Source of truth for local dev:** `.env.local` (gitignored). Created from `.env.example`.
- **Source of truth for CI:** GitHub Actions repository secrets, one secret per variable.
- **Source of truth for production:** the deploy platform's secret manager (Vercel/Render/Fly env). One secret per variable.
- **Forbidden:** committing `.env` or `.env.local`; storing secrets in Notion; hardcoding secrets in code or docs; checking `process.env.X` outside `@lifeos/shared/env`.
- **Required file per phase that introduces a secret:** add the row to `.env.example` and to the phase's `phase-NN-outputs.md` under "env required".
- **Required for production launch (Phase 60):** a documented secret rotation runbook in `docs/runbooks/secret-rotation.md`.

## 22. Rollback protocol (binding from Phase 02 onward)
- Every migration MUST be paired with a documented manual rollback note in the same file footer (`-- ROLLBACK: ...`).
- Every deploy MUST be reversible via re-deploying the previous git tag.
- A full rollback runbook lives at `docs/runbooks/rollback.md` (introduced in Phase 01) and is updated whenever a new external system (storage, push, AI provider) is added.
```

### Step 18 — `docs/governance/global-forbidden-list.md`

```markdown
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
```

### Step 19 — `scripts/check-mvp-scope.ts`

```tsx
/**
 * MVP scope gate.
 * Source of truth: docs/product/mvp-scope.md + this file (1:1 mapping enforced by the test).
 */
export const MVP_ALLOWED = new Set<string>([
  'auth',
  'workspace',
  'dashboard',
  'pages',
  'notes',
  'tasks',
  'habits',
  'finance',
  'goals',
  'calendar',
  'search',
  'ai-gateway',
  'vault',
  'settings',
  'pwa',
]);

export class PostMvpFeatureError extends Error {
  readonly code = 'POST_MVP_FEATURE';
  constructor(feature: string) {
    super(`POST_MVP_FEATURE: ${feature} is outside MVP scope`);
    this.name = 'PostMvpFeatureError';
  }
}

export function isMvpFeature(feature: string): boolean {
  return MVP_ALLOWED.has(feature);
}

export function assertMvpFeature(feature: string): void {
  if (!isMvpFeature(feature)) {
    throw new PostMvpFeatureError(feature);
  }
}

// CLI: pnpm tsx scripts/check-mvp-scope.ts <feature>
if (process.argv[1]?.endsWith('check-mvp-scope.ts')) {
  const feature = process.argv[2];
  if (!feature) {
    console.error('Usage: check-mvp-scope.ts <feature>');
    process.exit(2);
  }
  try {
    assertMvpFeature(feature);
    console.log(`OK: "${feature}" is in MVP scope`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
```

### Step 20 — `scripts/__tests__/check-mvp-scope.test.ts` (alignment 1:1، بدون aliases)

```tsx
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertMvpFeature,
  isMvpFeature,
  MVP_ALLOWED,
  PostMvpFeatureError,
} from '../check-mvp-scope';

const DOCUMENTED = [
  'auth', 'workspace', 'dashboard', 'pages', 'notes',
  'tasks', 'habits', 'finance', 'goals', 'calendar',
  'search', 'ai-gateway', 'vault', 'settings', 'pwa',
] as const;

describe('check-mvp-scope', () => {
  it('lists exactly 15 MVP features', () => {
    expect(MVP_ALLOWED.size).toBe(15);
  });

  it('accepts every documented MVP feature', () => {
    for (const f of DOCUMENTED) {
      expect(isMvpFeature(f)).toBe(true);
    }
  });

  it('rejects Post-MVP features with PostMvpFeatureError', () => {
    expect(() => assertMvpFeature('billing')).toThrow(PostMvpFeatureError);
    expect(() => assertMvpFeature('marketplace')).toThrow(/POST_MVP_FEATURE/);
    expect(() => assertMvpFeature('mobile-native')).toThrow(/POST_MVP_FEATURE/);
  });
});

describe('MVP docs and script stay aligned (strict 1:1, no aliases)', () => {
  const md = readFileSync('docs/product/mvp-scope.md', 'utf8');

  // Extract first cell of every data row in the table (skip header + separator)
  function extractKeys(markdown: string): string[] {
    return markdown
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .filter((l) => !l.includes('---'))
      .filter((l) => !/feature\s*key/i.test(l))
      .map((l) => l.split('|')[1]?.trim() ?? '')
      .filter(Boolean);
  }

  const documentedKeys = extractKeys(md);

  it('mvp-scope.md table has exactly 15 rows', () => {
    expect(documentedKeys.length).toBe(15);
  });

  it('every key in MVP_ALLOWED appears in mvp-scope.md (no aliases)', () => {
    const docSet = new Set(documentedKeys);
    for (const key of MVP_ALLOWED) {
      expect(docSet.has(key)).toBe(true);
    }
  });

  it('every row in mvp-scope.md exists in MVP_ALLOWED', () => {
    for (const key of documentedKeys) {
      expect(MVP_ALLOWED.has(key)).toBe(true);
    }
  });
});
```

📌 **القاعدة:** `extractKeys` يقرأ العمود الأول من كل صف بيانات حرفياً، بدون أي `aliases` map. التطابق 1:1 صارم.

### Step 22 — `docs/execution/phase-00-checklist.md` (محتوى محدد، ليس فارغاً)

```markdown
# Phase 00 Checklist

> AI Executor: tick every box in order. Do NOT proceed to Phase 01 until all are ticked and the lock marker (Step 25) is written.

## A. Docs written (no empty headings)
- [ ] docs/execution/phase-00-understanding.md
- [ ] docs/product/vision.md
- [ ] docs/product/icp.md
- [ ] docs/product/pains-and-jobs.md
- [ ] docs/product/differentiators.md
- [ ] docs/product/mvp-scope.md (15 rows + notation note)
- [ ] docs/product/out-of-scope.md
- [ ] docs/product/success-metrics.md
- [ ] docs/product/free-forever-model.md
- [ ] docs/product/risk-register.md (RISK-001 … RISK-011)
- [ ] docs/product/launch-criteria.md
- [ ] docs/product/roadmap.md (60-phase map)
- [ ] docs/adr/template.md
- [ ] docs/governance/scope-gate.md
- [ ] docs/governance/privacy-claims-policy.md
- [ ] docs/governance/ai-execution-rules.md
- [ ] docs/governance/global-conventions.md
- [ ] docs/governance/global-forbidden-list.md

## B. Scripts written and passing
- [ ] scripts/check-mvp-scope.ts
- [ ] scripts/__tests__/check-mvp-scope.test.ts
- [ ] `pnpm tsx scripts/check-mvp-scope.ts auth` exits 0
- [ ] `pnpm tsx scripts/check-mvp-scope.ts workspace` exits 0
- [ ] `pnpm tsx scripts/check-mvp-scope.ts billing` exits 1 with `POST_MVP_FEATURE`
- [ ] `vitest run scripts/__tests__/check-mvp-scope.test.ts` passes (alignment 1:1)

## C. Consistency checks
- [ ] mvp-scope.md row count = MVP_ALLOWED.size (= 15) — both `auth` and `workspace` exist as separate rows.
- [ ] No file uses the alias `auth+workspace` or `auth + workspace`.
- [ ] Every Out-of-Scope row has a reason and a future phase or "never".
- [ ] Every Risk has Owner + Mitigation + Status.
- [ ] No file contains the word "Stripe", "paywall", or "premium-only".
- [ ] No file claims "Zero-Knowledge" without `CLAIM_NOT_ALLOWED_YET` (lifted after Phase 04 tests pass).

## D. Lock
- [ ] Step 25 marker line appended below.
- [ ] git tag `phase-00-product-contract-locked` created and pushed.

## Lock marker (appended by Step 25)
<!-- phase-00-product-contract-locked: YYYY-MM-DDTHH:MM:SSZ -->
```

### Step 23 — `docs/execution/phase-00-decisions-log.md` (محتوى محدد)

```markdown
# Phase 00 Decisions Log

> One row per decision. Append-only. Never edit a past row; add a new row that supersedes it and link the predecessor.

| ID | Date (UTC) | Decision | Rationale | Alternatives Rejected | Supersedes | Owner |
|---|---|---|---|---|---|---|
| D-001 | YYYY-MM-DD | Free-forever model with optional donations only | Aligns with privacy positioning; removes paywall from MVP | Freemium with paid AI; subscription tiers | — | Product |
| D-002 | YYYY-MM-DD | Desktop-first PWA, dark-only UI | Matches ICP; reduces UI surface for MVP | Mobile-first native; multi-theme | — | Product/Design |
| D-003 | YYYY-MM-DD | Postgres with RLS + FORCE RLS as the only multi-tenant boundary | Strongest known row-level boundary; tested via pgTAP | App-only enforcement; one DB per tenant | — | Backend/Security |
| D-004 | YYYY-MM-DD | Vault uses ZKE (client-side encryption); never ZKP | ZKE matches the actual implementation; ZKP is unrelated | Claiming "ZKP" in marketing copy | — | Security |
| D-005 | YYYY-MM-DD | Single `MVP_ALLOWED` source validated 1:1 against `mvp-scope.md` | Prevents drift between docs and runtime guard | Two independent lists; manual review only | — | DX |
| D-006 | YYYY-MM-DD | 15 MVP feature keys locked (auth, workspace, dashboard, pages, notes, tasks, habits, finance, goals, calendar, search, ai-gateway, vault, settings, pwa) | Smallest set that delivers the LifeOS promise | Adding billing / marketplace / mobile-native | — | Product |
| D-007 | YYYY-MM-DD | All packages namespaced `@lifeos/*` | Removes import ambiguity; CI enforces | Bare `packages/*` imports | — | DX |
| D-008 | YYYY-MM-DD | DB client interface fixed to `one/oneOrNone/many/none/tx` | Driver-independent surface; uniform error semantics | Direct `pg` / Prisma / Drizzle | — | Backend |
| D-009 | YYYY-MM-DD | API envelope = `{ ok, data, meta? }` or `{ ok:false, error:{code,message,metadata?} }` | One shape across all routes | Throwing raw errors; arbitrary JSON | — | Backend |
| D-010 | YYYY-MM-DD | Privacy claims gated behind implementation + test (`CLAIM_NOT_ALLOWED_YET`) | Prevents marketing-driven false claims | Aspirational copy in README/landing | — | Product/Security |
| D-011 | YYYY-MM-DD | `packages/ai` will be created in Phase 06; until then any direct AI SDK import is forbidden | Avoids accidental provider lock-in and vault leaks during early phases | Allowing temporary direct calls | — | AI/Security |
| D-012 | 2026-05-24 | Migration ranges revised post-implementation + Wxx notation retired + 100-slot policy locked from Phase 06+ | Phase 00 v1.2 promised ranges (0001–0099 / 0100–0199 / 0200–0299 / 0300–0399 / none) diverged from actual Phase 02..05 usage (0001–0118 / 0119–0147 / 0148–0199 / 0200–0299); ADR-0024 from Phase 05 retires `Wxx` and `wave/*`; future phases need a deterministic formula | (a) Keep inaccurate ranges in docs and let drift grow; (b) Renumber already-applied migrations | Partially supersedes D-006 phase notation; refines convention from D-007/D-008 | DX/Backend |

> AI Executor: replace `YYYY-MM-DD` with the actual ISO date when committing. New decisions after Phase 00 go to `docs/adr/<NNNN>-*.md`.
```

### Step 21 — `vitest.config.ts` (مطلوب حتى تعمل اختبارات Step 20 — يُكتب قبل Step 22)

```tsx
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['scripts/**/*.test.ts'],
		exclude: ['**/node_modules/**'],
		poolOptions: { threads: { singleThread: true } },
	},
});
```

📌 **السبب:** Phase 00 تحتوي على `scripts/__tests__/check-mvp-scope.test.ts`، وتشغيله يحتاج vitest config. Phase 01 ستوسّع هذا الملف ليحتوي `packages/**` و `apps/**` + aliases.

📌 **أول install:** `pnpm add -D vitest @types/node typescript tsx` (بدون root package.json فعلي؛ Phase 01 تُنشئ root package.json الكامل). في Phase 00 يكفي `npx -y vitest run` لتشغيل الاختبار بدون install.

### Step 24 — `docs/execution/phase-00-outputs.md` (جديد — Inter-phase Contract)

```markdown
# Phase 00 Outputs (→ Phase 01 contract)

> AI Executor of Phase 01 may rely on the following being present and correct after `git tag --list | grep -x phase-00-product-contract-locked` exits 0.

## A. Files (guaranteed)
- `docs/execution/phase-00-understanding.md`
- `docs/execution/phase-00-checklist.md` (lock marker line present)
- `docs/execution/phase-00-decisions-log.md` (rows D-001…D-011)
- `docs/product/*.md` (11 files)
- `docs/governance/scope-gate.md`
- `docs/governance/privacy-claims-policy.md`
- `docs/governance/ai-execution-rules.md`
- `docs/governance/global-conventions.md` (SoT for naming + DbClient + envelope + RLS + secrets + rollback)
- `docs/governance/global-forbidden-list.md`
- `docs/adr/template.md`
- `scripts/check-mvp-scope.ts`
- `scripts/__tests__/check-mvp-scope.test.ts`
- `vitest.config.ts` (minimal, scripts-only includes)

## B. Git artefacts (guaranteed)
- Branch: `phase/00-product-contract` (merged into `main` before lock).
- Annotated tag: `phase-00-product-contract-locked`.

## C. Conventions promised to all later phases
- Branch naming: `phase/NN-short-name`.
- Exit tag naming: `phase-NN-locked` (Phase 00 keeps historical `phase-00-product-contract-locked`).
- DbClient interface: `one / oneOrNone / many / none / tx`.
- API envelope: `{ ok:true, data, meta? } | { ok:false, error:{code,message,metadata?} }`.
- AppError + ErrorCode + Result live in `@lifeos/shared/errors` only.
- ULID via `@lifeos/shared/ids/newUlid`.
- Money: `*_cents BIGINT` + `currency CHAR(3)`.
- Time: TIMESTAMPTZ UTC + `Clock` abstraction.
- **Migration ranges (actual, post-D-012):** P01 = none (architecture-only). P02 = 0001–0118. P03 = 0119–0147. P04 = 0148–0199 (0148–0157 used). P05 = 0200–0299 (0200–0204 used). From P06 onward: strict 100-slot reservation — P(NN) = `((NN−6)×100+300)..((NN−6)×100+399)`. So P06=0300–0399, P07=0400–0499, etc. CI gate `scripts/migrate.ts` enforces this.
- Secrets: `.env.local` (dev), GitHub Actions secrets (CI), platform manager (prod). Never in Notion/Git.
- Rollback: every migration carries `-- ROLLBACK:` note; runbook at `docs/runbooks/rollback.md` from Phase 01.

## D. Env vars (none introduced by Phase 00)
Phase 00 introduces no env vars. First env var (`DATABASE_URL`) is introduced by Phase 01 and recorded in `.env.example`.

## E. Migration range used by this phase
None. Phase 00 has zero migrations.

## F. Stubs left behind for later phases
- `packages/ai` — not created; first import in Phase 06.
- `docs/runbooks/rollback.md` — not created; introduced in Phase 01.
- `docs/runbooks/secret-rotation.md` — not created; introduced before Phase 60.

## G. Open risks carried forward
RISK-001 … RISK-011 are all Open. Phase 02 inherits all of them; mitigations begin in Phase 01 (RISK-005, RISK-011) and Phase 02 (RISK-001).
```

### Step 25 — `phase-00-product-contract-locked` marker (تعليمات صريحة)

📌 **نفّذ هذه الأوامر بالحرف بعد إكمال Steps 1 → 24 ونجاح كل اختبارات Phase 00:**

```bash
# 1) Append the lock line to the checklist (replaces the placeholder comment).
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
sed -i.bak \
  "s|^<!-- phase-00-product-contract-locked: YYYY-MM-DDTHH:MM:SSZ -->|<!-- phase-00-product-contract-locked: ${TS} -->|" \
  docs/execution/phase-00-checklist.md
rm docs/execution/phase-00-checklist.md.bak

# 2) Commit everything that belongs to Phase 00.
git add docs/ scripts/
git commit -m "phase-00: lock product contract & global conventions"

# 3) Create the annotated git tag (this is THE marker).
git tag -a phase-00-product-contract-locked \
  -m "Phase 00 locked: 15 MVP features, global conventions, forbidden list, risks RISK-001..RISK-011"

# 4) Push tag.
git push origin phase-00-product-contract-locked

# 5) Sanity check (must exit 0):
git tag --list | grep -x phase-00-product-contract-locked

# 6) Sanity check that the outputs document exists:
test -f docs/execution/phase-00-outputs.md
```

📌 **القاعدة:** Phase 01 **لا يبدأ** قبل أن يخرج `git tag --list | grep -x phase-00-product-contract-locked` بـ exit 0 **و** `docs/execution/phase-00-outputs.md` موجود. هذان الشرطان مُفعَّلان في `Preflight` لـ Phase 01.

## 6. AI Executor Warnings

- ❌ لا تبدأ بالكود.
- ❌ لا تبني UI / DB / AI / Billing هنا.
- ❌ لا تكتب marketing claims غير مدعومة.
- ❌ لا تستخدم `ZKP` بدل `ZKE`.
- ❌ لا تضف Paywall.
- ❌ لا تسمح للـ AI بالوصول إلى vault / high-sensitivity content.
- ❌ لا تترك feature بدون metric.
- ❌ لا تضف key في `MVP_ALLOWED` بدون صف في `mvp-scope.md` (والعكس).
- ❌ لا تستخدم aliases مثل `auth+workspace`.
- ❌ لا تعدل `global-conventions.md` بدون ADR في `docs/adr/`.

## 7. Checklist النهائي

- [ ]  كل folders موجودة.
- [ ]  3 ملفات `docs/execution/` مكتوبة بمحتوى حقيقي (بما فيها checklist + decisions log).
- [ ]  11 ملف `docs/product/` مكتوبة (بما فيها roadmap).
- [ ]  5 ملفات `docs/governance/` مكتوبة (بما فيها global-conventions + global-forbidden-list).
- [ ]  `docs/adr/template.md` موجود.
- [ ]  `scripts/check-mvp-scope.ts` + test مكتوبان.
- [ ]  alignment test ينجح بدون aliases.
- [ ]  جدول [mvp-scope.md](http://mvp-scope.md) = 15 صف.
- [ ]  `MVP_ALLOWED.size` = 15.
- [ ]  Risk register فيه RISK-001 … RISK-011.
- [ ]  git tag `phase-00-product-contract-locked` موجود ومدفوع.
- [ ]  سطر `phase-00-product-contract-locked: <ISO>` موجود في checklist.

## 8. Definition of Done

Phase 00 تعتبر جاهزة فقط عند تحقق كل ما يلي:

- كل الملفات موجودة بالمسارات الصحيحة وبمحتوى حقيقي (لا headings فارغة).
- لا يوجد feature خارج MVP بدون نقله إلى Out-of-scope.
- لا يوجد ادعاء privacy/security غير مدعوم.
- كل risks الحرجة (P0/P1) لها mitigation.
- تم توثيق قرار Free Forever + Donations-only في [decisions-log.md](http://decisions-log.md).
- `vitest.config.ts` موجود و `npx -y vitest run` ينجح في الاختبارات الـ 6.
- `pnpm tsx scripts/check-mvp-scope.ts auth` و `workspace` ينجحان.
- `pnpm tsx scripts/check-mvp-scope.ts billing` يفشل بـ `POST_MVP_FEATURE`.
- جدول `mvp-scope.md` = 15 صف يطابق `MVP_ALLOWED` 1:1 بدون aliases.
- `docs/product/roadmap.md` يحتوي 60-phase map و branch/tag conventions الموحدة.
- `docs/governance/global-conventions.md` يحتوي Sections 19+20+21+22 (Branches/Tags, Inter-phase Outputs, Secrets, Rollback).
- `docs/execution/phase-00-outputs.md` مكتوب بالكامل (Inter-phase contract).
- `docs/adr/template.md` جاهز للنسخ.
- git tag `phase-00-product-contract-locked` معمول ومدفوع.

## 9. الانتقال إلى Phase 01

بعد تحقق Definition of Done بالكامل، انتقل إلى [مرحلة 1](https://www.notion.so/1-4107ee11c78783238e4d01c12fcbee46?pvs=21) (Architecture Contracts & Naming Freeze).