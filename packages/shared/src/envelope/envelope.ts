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
