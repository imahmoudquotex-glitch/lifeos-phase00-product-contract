# ADR 0016 — Workspace Monthly AI Token Limit

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

The AI feature (Phase 03) requires a per-workspace monthly quota to prevent runaway LLM costs. The quota must be:
1. **Configurable per workspace** — different plans can have different limits.
2. **Enforceable at the DB layer** — the `reserve_ai_usage` RPC (ADR 0011) reads the limit.
3. **Available immediately** — changing the limit takes effect on the next reservation check.

The workspace already has a `workspaces` table (migration 0106). The question is where to store the limit.

## Decision

Add `monthly_ai_token_limit BIGINT NOT NULL DEFAULT 100000` to the `workspaces` table via `0119__profiles_extensions.sql`. This migration extends the workspace row with AI-related configuration alongside other workspace capability fields added in Phase 03.

The default of **100,000 tokens/month** corresponds to approximately:
- ~1,000 GPT-4o requests at 100 tokens/request, or
- ~100,000 words generated with a typical 1 token/word ratio.

A value of `0` means AI features are disabled for the workspace. A value of `-1` is reserved for "unlimited" (admin-created workspaces).

## Alternatives Considered

- **Separate `workspace_ai_config` table** — rejected for Phase 03. The workspaces table has fewer than 10 columns; adding one more is not a normalization concern. Revisit if workspace config exceeds 15 columns.
- **Hard-coded limit** — rejected because plan tiers (Free/Pro/Enterprise) need different limits. Hard-coded limits require a code deploy to change.
- **Store limit in application config (env var)** — rejected because it applies globally, not per-workspace. Workspaces on different plans need different limits.
- **Limit stored in a `features` JSONB column** — rejected because JSONB is not indexable and the RPC query would need to extract the value with type casting.

## Consequences

- **Positive**: simple — the `reserve_ai_usage` RPC reads `workspaces.monthly_ai_token_limit` in the same query that checks usage. No additional join required.
- **Positive**: admin can update a workspace's limit with a single `UPDATE workspaces SET monthly_ai_token_limit = $1 WHERE id = $2`.
- **Negative**: AI configuration is coupled to the workspace row. If many AI parameters are added in future phases, the workspace table could grow large. Mitigated by the planned extraction threshold (>15 columns → separate config table).
- **CI enforcement**: Verified by `reserve_ai_usage` function test which reads the limit from the workspace row.

## Links

- Related migration: `0119__profiles_extensions.sql`
- Related ADR: 0011 (AI quota RPC reads this column)
- Related code: `packages/services/src/ai/ai.service.ts`
