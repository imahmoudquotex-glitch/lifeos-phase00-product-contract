# LifeOS Roadmap — 60-Phase High-Level Map

> Phase 00 is the contract. Phases 01 → 60 implement it. Each phase has its own page; this file is the table of contents and the ordering constraint.

| Wave | Phases | Theme | Outcome |
|---|---|---|---|
| W00 | 01 | Architecture Contracts & Naming Freeze | Monorepo, shared packages, DB client interface, CI guards. |
| W01 | 02 | Kernel: Workspace, Profile, Pages | Auth tables, workspace, RLS, page tree. |
| W02 | 03 | Data Plane: Tasks, Notes, Habits, Expenses, Calendar, Vault metadata, AI Quota | All tenant tables + repos + services. Vault crypto (XChaCha20) arrives in Phase 04. |
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
