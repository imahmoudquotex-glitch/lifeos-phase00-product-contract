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
