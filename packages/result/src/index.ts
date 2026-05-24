// Facade only. NEVER define new types here.
// Any duplicate `class AppError` outside @lifeos/shared/errors/app-error.ts breaks CI.
export { ok, err, isOk, isErr } from '@lifeos/shared/errors';
export type { Result, Ok, Err } from '@lifeos/shared/errors';
export { AppError } from '@lifeos/shared/errors';
export type { ErrorCode } from '@lifeos/shared/errors';
