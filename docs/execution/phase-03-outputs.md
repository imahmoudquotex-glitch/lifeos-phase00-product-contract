# Phase 03 Outputs — Domain Schemas & Data Plane

## A. Migrations Applied (29 total)

```
0119__profiles_extensions.sql        — users: timezone/locale/display_name; workspaces: monthly_ai_token_limit
0120__tasks.sql                       — Tasks table (hierarchical, soft-delete)
0121__tasks_indexes.sql               — Partial indexes (status, due_at, parent_id)
0122__tasks_rls.sql                   — Tasks RLS (workspace isolation + soft-delete filter)
0123__notes.sql                       — Notes table (optimistic version column)
0124__note_versions.sql               — Note versions (append-only history)
0125__notes_rls.sql                   — Notes + note_versions RLS
0126__habits.sql                      — Habits table (daily/weekly/monthly frequency)
0127__habit_checkins.sql              — Habit check-ins (unique per habit+user+date)
0128__habits_rls.sql                  — Habits + habit_checkins RLS
0129__expenses.sql                    — Expenses (BIGINT cents, ADR 0010)
0130__budgets.sql                     — Budgets per workspace+category
0131__expenses_rls.sql                — Expenses + budgets RLS
0132__calendar_events.sql             — Calendar events (ends_at > starts_at CHECK)
0133__calendar_rls.sql                — Calendar RLS
0134__vault_items_metadata.sql        — Vault metadata only (crypto deferred to Phase 04)
0135__vault_rls.sql                   — Vault RLS (workspace + owner-only)
0136__ai_usage_events.sql             — AI usage ledger with idempotency key
0137__ai_usage_indexes.sql            — AI usage month + status indexes
0138__ai_usage_rls.sql                — AI usage RLS
0139__ai_usage_rpcs.sql               — reserve_ai_usage / complete_ai_usage / refund_ai_usage
0140__xp_events.sql                   — XP events ledger + inline RLS
0141__daily_reviews.sql               — Daily reviews (1 per user/day)
0142__import_jobs.sql                 — Import jobs queue
0143__public_shares.sql               — Public share tokens (hash-only)
0144__webhook_nonces.sql              — Webhook nonces (global, no RLS)
0145__audit_logs_extensions.sql       — Audit logs + resource/ip/user_agent columns
0146__rate_limit_buckets_extensions.sql — Rate limit buckets + scope/workspace_id
0147__outbound_emails.sql             — Outbound email queue (no RLS)

Next available migration number: 0148
Reserved range for Phase 03 patches: 0148–0199
```

## B. Tables Introduced

```
tasks, notes, note_versions, habits, habit_checkins,
expenses, budgets, calendar_events, vault_items (metadata only),
ai_usage_events, xp_events, daily_reviews, import_jobs,
public_shares, webhook_nonces, outbound_emails
```

## C. Sensitive Columns Inventory

| Table | Column | Type | Note |
|---|---|---|---|
| `expenses` | `amount_cents` | BIGINT | money (ADR 0010) |
| `budgets` | `monthly_limit_cents` | BIGINT | money (ADR 0010) |
| `vault_items` | `title_hash` | TEXT | SHA-256 hash, not plaintext (ADR 0013) |
| `vault_items` | `encrypted_blob/nonce/wrapped_dek` | — | **added in Phase 04** |
| `public_shares` | `token_hash` | TEXT | SHA-256 hash of share token |
| `audit_logs` | `ip_address` | INET | PII |
| `audit_logs` | `user_agent` | TEXT | PII |

## D. AI Quota Defaults

```
Default monthly_limit_tokens per workspace: 100_000
Reserved tokens count toward usage until refunded
Completed events use tokens_used (final); reserved events use tokens_reserved (estimate)
Idempotency: UNIQUE(workspace_id, idempotency_key)
```

## E. Services Exported

```
@lifeos/services → tasks, notes, habits, expenses, calendar, vault, ai, xp, reviews, imports, shares, webhooks
```

| Export | Classes |
|---|---|
| tasks | `TaskService`, `TaskRepo`, `Task` |
| notes | `NoteService`, `NoteRepo`, `Note`, `NoteVersion` |
| habits | `HabitService`, `HabitRepo`, `Habit`, `HabitCheckin` |
| expenses | `ExpenseService`, `ExpenseRepo`, `BudgetRepo`, `Expense`, `Budget` |
| calendar | `CalendarService`, `CalendarRepo`, `CalendarEvent` |
| vault | `VaultMetaService`, `VaultMetaRepo`, `VaultItemMeta` |
| ai | `AiQuotaService`, `AiQuotaRepo`, `AiUsageEvent` |
| xp | `XpService`, `XpRepo`, `XpEvent` |
| reviews | `DailyReviewService`, `DailyReviewRepo`, `DailyReview` |
| imports | `ImportJobService`, `ImportJobRepo`, `ImportJob` |
| shares | `PublicShareService`, `PublicShareRepo`, `PublicShare` |
| webhooks | `WebhookNonceService`, `WebhookNonceRepo` |

## F. AppError Codes Added (19)

```
TASK_NOT_FOUND
NOTE_NOT_FOUND, NOTE_VERSION_CONFLICT
HABIT_NOT_FOUND, HABIT_CHECKIN_DUPLICATE
EXPENSE_NOT_FOUND, EXPENSE_AMOUNT_INVALID, BUDGET_EXCEEDED
CALENDAR_EVENT_NOT_FOUND, CALENDAR_TIME_INVALID
VAULT_ITEM_NOT_FOUND
AI_QUOTA_EXCEEDED, AI_USAGE_NOT_RESERVED, AI_USAGE_NOT_REFUNDABLE, WORKSPACE_NOT_FOUND
IMPORT_JOB_NOT_FOUND, PUBLIC_SHARE_NOT_FOUND, PUBLIC_SHARE_EXPIRED, WEBHOOK_NONCE_REUSED
```

## G. ADRs Added (8)

```
0010-money-storage-bigint-cents.md
0011-ai-quota-race-free-rpc.md
0012-note-version-optimistic-concurrency.md
0013-vault-metadata-vs-crypto-separation.md
0014-base-repo-no-select-star.md
0015-actor-type-in-permissions.md
0016-workspace-monthly-ai-token-limit.md
0017-expense-budget-check-transactional.md
```

## H. Tests Added

### pgTAP (DB isolation)
```
tests/pgtap/_setup.sql
tests/pgtap/0120_tasks_rls.sql       — 4 assertions
tests/pgtap/0123_notes_rls.sql       — 3 assertions
tests/pgtap/0126_habits_rls.sql      — 3 assertions
tests/pgtap/0129_expenses_rls.sql    — 3 assertions
tests/pgtap/0132_calendar_rls.sql    — 2 assertions
tests/pgtap/0134_vault_rls.sql       — 3 assertions
tests/pgtap/0136_ai_usage_rls.sql    — 2 assertions
```

### Vitest (unit)
```
tests/unit/ai-quota-race.test.ts
tests/unit/ai-quota-idempotency.test.ts
tests/unit/ai-quota-refund.test.ts
tests/unit/expenses-money.test.ts
tests/unit/note-version-conflict.test.ts
tests/unit/habit-checkin-duplicate.test.ts
tests/unit/calendar-time-validation.test.ts
tests/integration/repos-no-select-star.test.ts
```

## I. Known Limitations Carried to Phase 04+

- `vault_items.encrypted_blob/nonce/wrapped_dek` not added — Phase 04 (Vault Crypto)
- `public_shares` lookup from outside workspace context needs `SECURITY DEFINER` function — Phase 04
- `outbound_emails` has no real worker — Phase 04 (real email provider integration)
- `import_jobs` has no real worker — Phase 06 (Importers wave)
- `xp_events` has no level-up rules — Phase 07 (Gamification wave)
