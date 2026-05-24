# ADR 0011 — AI Quota: Race-Free RPC + SECURITY DEFINER

## Status
Accepted

## Context
AI token quotas must be enforced atomically. Computing available tokens in TypeScript and then inserting is a TOCTOU (Time-Of-Check Time-Of-Use) race condition: two concurrent requests could both pass the quota check and collectively exceed the limit.

## Decision
Three `SECURITY DEFINER` PostgreSQL functions handle quota atomically:

| Function | Purpose |
|---|---|
| `reserve_ai_usage(id, workspace_id, user_id, idem_key, tokens)` | Locks workspace row `FOR UPDATE`, checks limit, inserts |
| `complete_ai_usage(event_id, tokens_used)` | Transitions `reserved → completed`, records actual tokens |
| `refund_ai_usage(event_id)` | Transitions to `refunded`, zeros reserved/used |

Error sentinel codes from RPCs:
- `P0002` → `AI_QUOTA_EXCEEDED`
- `P0003` → `AI_USAGE_NOT_RESERVED` (event not in `reserved` state)
- `P0004` → `AI_USAGE_NOT_REFUNDABLE`
- `P0005` → `WORKSPACE_NOT_FOUND`

All RPCs called via `AiQuotaService`, never from route handlers directly.

## Idempotency
Unique constraint `UNIQUE(workspace_id, idempotency_key)` — RPC returns existing event on duplicate key.

## Consequences
- ✅ Race-free: locking done in DB under serializable-like semantics
- ✅ Idempotent reservation
- ✅ `tokens_used` (final count) preferred over `tokens_reserved` (estimate) for completed events
- ❌ DB function changes require a migration
- ❌ Workspace row serialization under high concurrent AI usage (acceptable at current scale)
