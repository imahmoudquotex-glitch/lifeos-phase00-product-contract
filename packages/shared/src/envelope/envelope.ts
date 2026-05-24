import { AppError } from '../errors/app-error';
import type { ErrorCode } from '../errors/codes';

export type ApiSuccess<T> = { ok: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
	ok: false;
	error: { code: string; message: string; metadata?: Record<string, unknown> };
};
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** Single SoT for ErrorCode -> HTTP status. Used by withApiErrorHandling and any future route adapter. */
export const STATUS_MAP: Partial<Record<ErrorCode, number>> = {
	AUTH_REQUIRED: 401,
	AUTH_FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	IDEMPOTENCY_REPLAY: 409,
	DB_CONSTRAINT: 409,
	IDEMPOTENCY_REQUIRED: 428,
	VALIDATION_FAILED: 422,
	MONEY_INVALID_CURRENCY: 422,
	MONEY_CURRENCY_MISMATCH: 422,
	RATE_LIMIT: 429,
	DB_EXPECTED_ONE: 500,
	DB_EXPECTED_ONE_OR_NONE: 500,
	ENV_MISSING: 500,
	UNKNOWN: 500,
	DB_TRANSIENT: 503,

	// ─── Phase 03 ────────────────────────────────────────────────────────────
	// 404 – resource not found
	TASK_NOT_FOUND: 404,
	NOTE_NOT_FOUND: 404,
	HABIT_NOT_FOUND: 404,
	EXPENSE_NOT_FOUND: 404,
	CALENDAR_EVENT_NOT_FOUND: 404,
	VAULT_ITEM_NOT_FOUND: 404,
	WORKSPACE_NOT_FOUND: 404,
	IMPORT_JOB_NOT_FOUND: 404,
	PUBLIC_SHARE_NOT_FOUND: 404,
	// 409 – conflict / duplicate / idempotency
	NOTE_VERSION_CONFLICT: 409,
	HABIT_CHECKIN_DUPLICATE: 409,
	AI_USAGE_NOT_RESERVED: 409,
	AI_USAGE_NOT_REFUNDABLE: 409,
	WEBHOOK_NONCE_REUSED: 409,
	// 400 – bad input
	EXPENSE_AMOUNT_INVALID: 400,
	CALENDAR_TIME_INVALID: 400,
	// 410 – gone / expired
	PUBLIC_SHARE_EXPIRED: 410,
	// 422 – business rule violation
	BUDGET_EXCEEDED: 422,
	// 429 – quota / rate
	AI_QUOTA_EXCEEDED: 429,
};

export function statusForError(e: unknown): number {
	if (e instanceof AppError) {
		const code = e.code as ErrorCode;
		return STATUS_MAP[code] ?? 500;
	}
	return 500;
}

export function envelopeOk<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
	return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function envelopeErr(e: AppError | Error, fallbackCode = 'UNKNOWN'): ApiFailure {
	if (e instanceof AppError) {
		return {
			ok: false,
			error: {
				code: String(e.code),
				message: e.message,
				...(e.metadata ? { metadata: e.metadata } : {}),
			},
		};
	}
	return { ok: false, error: { code: fallbackCode, message: e.message } };
}
