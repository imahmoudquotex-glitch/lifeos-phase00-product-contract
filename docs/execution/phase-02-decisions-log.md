# Phase 02 Decisions Log

| Decision ID | Description | Context / Reason |
| --- | --- | --- |
| D-013 | Created 19 explicit `.sql` migration files. | Ensures idempotency and strict compliance with the plan for custom Auth/RLS. |
| D-014 | Bypassed Supabase Auth schema. | The spec explicitly demands building a custom Auth Kernel (users, sessions, tokens) and forbids using Supabase Auth. |
| D-015 | Used local PostgreSQL `DATABASE_URL` as a placeholder. | Awaiting remote DB connection details, but this allows CI and codebase checks to proceed unblocked. |
| D-016 | `withWorkspaceRoute` injects `dbClient`. | Ensures all route-level database operations run inside the RLS context initialized in `withWorkspaceContext`. |
| D-017 | Generated dummy `SESSION_PEPPER`. | Ensures local development is fully functional; production pepper will be securely stored. |
