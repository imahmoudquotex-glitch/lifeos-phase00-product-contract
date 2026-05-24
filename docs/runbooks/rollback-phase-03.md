# Rollback Phase 03

## Trigger
- CI failure on `phase-03-locked` candidate
- Critical bug discovered post-deploy

## Strategy
Phase 03 introduces 29 migrations (0119–0147). All have `-- ROLLBACK:` footer.

## Order
Rollback in **reverse** order: 0147 → 0119.

## Steps

1. `git revert` the PR merge commit (or cherry-pick fix onto a new branch)
2. Run `pnpm db:migrate:rollback --to 0118` (uses `-- ROLLBACK:` footers)
3. Verify `schema_migrations` shows last version = `0118`
4. Delete tag locally and remotely:
   ```
   git tag -d phase-03-locked
   git push --delete origin phase-03-locked
   ```
5. Run full test suite against rolled-back DB
6. Open incident postmortem doc

## Data Impact

> [!CAUTION]
> The following tables will be **DROPPED** — all data will be LOST:
> `tasks`, `notes`, `note_versions`, `habits`, `habit_checkins`, `expenses`, `budgets`,
> `calendar_events`, `vault_items`, `ai_usage_events`, `xp_events`, `daily_reviews`,
> `import_jobs`, `public_shares`, `webhook_nonces`, `outbound_emails`

Extension columns on `users` (`timezone`, `locale`, `display_name`) will also be dropped.
Extension columns on `workspaces` (`monthly_ai_token_limit`) will also be dropped.

This is acceptable because Phase 03 is pre-launch (no real user data).

## Forward-Fix Preferred

If the issue is isolated (e.g. one migration or one RPC), prefer a forward-fix migration in `0148+` over a full rollback.
