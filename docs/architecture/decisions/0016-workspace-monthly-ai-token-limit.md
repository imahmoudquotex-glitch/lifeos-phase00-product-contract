# ADR 0016 — Monthly AI Token Limit on Workspaces Table

## Status
Accepted

## Context
The AI quota limit must be authoritative and tamper-proof. If the limit were passed as an application parameter to the quota function, a bug or malicious code could bypass it.

## Decision
- `workspaces.monthly_ai_token_limit BIGINT NOT NULL DEFAULT 100000`
- The `reserve_ai_usage` RPC reads this column directly under `FOR UPDATE` lock
- Application code never passes the limit — the DB reads it atomically within the same transaction

```sql
SELECT monthly_ai_token_limit INTO v_limit
FROM workspaces
WHERE id = p_workspace_id
FOR UPDATE;
```

## Default
`100_000` tokens/month per workspace (configurable per workspace via DB UPDATE by admins).

## Consequences
- ✅ Tamper-proof: limit is read from DB under lock
- ✅ Per-workspace customization possible without code changes
- ✅ Atomic read under transaction — no TOCTOU
- ❌ Changing a workspace's limit requires a DB `UPDATE` (no config file change)
- ❌ Limit is in tokens (model-specific) — cross-model normalization is application-layer concern
