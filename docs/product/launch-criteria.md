# Launch Criteria

## Launch Allowed When
- 0 P0/P1 bugs.
- RLS tests 100% pass.
- AI safety violations = 0.
- Vault plaintext leak tests pass.
- WCAG audit passes (axe serious/critical = 0).
- PWA installability passes.
- Backup/restore drill succeeds.
- CSP report-only ran 2 weeks without critical violations.

## Launch Blocked When
- Any cross-tenant leak exists.
- Any vault plaintext reaches logs/AI/cache.
- Any critical auth bug exists.
- Any required MVP flow is broken.
- Any privacy claim is not backed by implementation + test.
