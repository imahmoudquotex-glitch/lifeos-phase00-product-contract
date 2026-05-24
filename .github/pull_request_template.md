## Scope Gate (Phase 00)
- [ ] Feature key matches a row in docs/product/mvp-scope.md
- [ ] Linked metric:
- [ ] Phase owner:
- [ ] Privacy/security risk addressed:

## Conventions (Phase 01)
- [ ] No SQL in route handlers
- [ ] No SELECT *
- [ ] No process.env.* outside @lifeos/shared/env
- [ ] Imports use @lifeos/* (no relative paths to other packages)
- [ ] AppError imported from @lifeos/shared/errors or @lifeos/result façade only
- [ ] DB calls go through DbClient.one/oneOrNone/many/none/tx
- [ ] No `new Date()` outside @lifeos/shared/time
- [ ] No direct AI SDK import (Phase 06 only)

## Tests
- [ ] Unit tests added
- [ ] Integration test or repo test where relevant
