# Phase 01 — Decisions Log

Tracks every deliberate deviation from `docs/planning/stage1.md` or expert-review findings.
Each entry has an ID, a classification, and a disposition.

---

## D-001 — eslint ^8.57.0 (vs ^9.0.0 in plan)

**Classification:** Improvement over plan  
**Source:** Implementation finding  
**Detail:** ESLint 9 dropped support for `.eslintrc.cjs` (requires flat config). The plan specified `^9.0.0` with `.eslintrc.cjs`, which would have failed CI immediately. Pinned to `^8.57.0` to keep `.eslintrc.cjs` format.  
**Expert review:** Confirmed "actually better — the plan would have failed CI."  
**Disposition:** Accepted. Will migrate to flat config when Phase 05 introduces UI tooling.

---

## D-002 — vitest.config.ts: `poolOptions` removed

**Classification:** Equivalent variant  
**Source:** Implementation  
**Detail:** `poolOptions: { threads: { singleThread: true } }` was omitted. Vitest 1.6 uses forks pool by default; the option is a no-op for the current test suite (no shared global state).  
**Expert review:** "No functional impact."  
**Disposition:** Accepted as-is.

---

## D-003 — `ci:guards` uses `tsx` (not `pnpm tsx`)

**Classification:** Equivalent variant  
**Source:** Implementation  
**Detail:** `tsx` is installed as a root devDependency, making it available on PATH after `pnpm install`. Both forms resolve to the same binary.  
**Expert review:** "Functionally equivalent."  
**Disposition:** Accepted as-is.

---

## D-004 — `withApiErrorHandling`: structured logging added

**Classification:** Fix (post-expert-review)  
**Source:** Expert review finding #4  
**Detail:** Original implementation returned the envelope correctly but did not emit a structured log on caught errors. `consoleLogger.error('api_error', { code, message, status, url, method })` now fires before the error response is returned.  
**Patch commit:** `fix(phase-01): address expert deviations D-004/D-005/D-007`  
**Disposition:** Fixed.

---

## D-005 — `/api/health` not wrapped with `withApiErrorHandling`

**Classification:** Fix (post-expert-review)  
**Source:** Expert review finding #5  
**Detail:** Health endpoint was exported as a plain `GET` function. For consistency with all other routes, it is now wrapped with `withApiErrorHandling`. Functionally equivalent for the happy path; improves coverage of the wrapper.  
**Patch commit:** `fix(phase-01): address expert deviations D-004/D-005/D-007`  
**Disposition:** Fixed.

---

## D-006 — `package.json` extra fields: `"license"` + `"check-scope"` script

**Classification:** Benign addition  
**Source:** Implementation  
**Detail:** `"license": "AGPL-3.0-only"` was added for OSS correctness. A `check-scope` convenience alias was added. Neither conflicts with any contract in stage1.md.  
**Expert review:** "Benign additions."  
**Disposition:** Accepted. `check-scope` will be documented in `docs/runbooks/dev-workflow.md` (Phase 02).

---

## D-007 — `phase-01-outputs.md` wrapped in triple-backtick code block

**Classification:** Fix (cosmetic, post-expert-review)  
**Source:** Expert review finding #7  
**Detail:** The file was accidentally written inside a ` ``` ` fence, rendering the entire document as a code block on GitHub. The fence was removed; the markdown now renders correctly.  
**Patch commit:** `fix(phase-01): address expert deviations D-004/D-005/D-007`  
**Disposition:** Fixed.

---

## D-008 — Git tagger email `lifeos@dev.local` (placeholder)

**Classification:** Cosmetic  
**Source:** Expert review finding #8 (also flagged in Phase 00)  
**Detail:** Git user.email is set to a placeholder in the dev environment. Tags and commits carry this address. This has no effect on code correctness, CI, or contract integrity.  
**Disposition:** Carry forward. Will be resolved when CI environment sets `GIT_AUTHOR_EMAIL` via GitHub Actions secret (Phase 01 CI yaml already scaffolded).
