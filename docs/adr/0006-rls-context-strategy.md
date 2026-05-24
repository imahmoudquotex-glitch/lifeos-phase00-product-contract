# 0006: RLS Context Strategy

## Context
Row-Level Security (RLS) policies need to know the current user and workspace.

## Decision
We use session GUCs via `set_config('app.current_user_id', ..., true)` within a transaction. This creates a single enforcement point at the DB level, impossible to bypass from any application code that uses the standard DbClient.
