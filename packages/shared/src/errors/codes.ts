/**
 * ErrorCodeRegistry is the single source of truth for all application error codes.
 * Add new codes by extending this interface – never by changing the ErrorCode union manually.
 *
 * Convention: value is always `true` (the type only cares about keys).
 */
export interface ErrorCodeRegistry {
	// ─── Core ───────────────────────────────────────────────────────────────
	UNKNOWN: true;
	ENV_MISSING: true;
	AUTH_REQUIRED: true;
	AUTH_FORBIDDEN: true;
	VALIDATION_FAILED: true;
	NOT_FOUND: true;
	CONFLICT: true;
	RATE_LIMIT: true;
	IDEMPOTENCY_REQUIRED: true;
	IDEMPOTENCY_REPLAY: true;
	MONEY_INVALID_CURRENCY: true;
	MONEY_CURRENCY_MISMATCH: true;
	DB_TRANSIENT: true;
	DB_CONSTRAINT: true;
	DB_EXPECTED_ONE: true;
	DB_EXPECTED_ONE_OR_NONE: true;

	// ─── Phase 03 ───────────────────────────────────────────────────────────
	// Tasks
	TASK_NOT_FOUND: true;
	// Notes
	NOTE_NOT_FOUND: true;
	NOTE_VERSION_CONFLICT: true;
	// Habits
	HABIT_NOT_FOUND: true;
	HABIT_CHECKIN_DUPLICATE: true;
	// Expenses / Budget
	EXPENSE_NOT_FOUND: true;
	EXPENSE_AMOUNT_INVALID: true;
	BUDGET_EXCEEDED: true;
	// Calendar
	CALENDAR_EVENT_NOT_FOUND: true;
	CALENDAR_TIME_INVALID: true;
	// Vault
	VAULT_ITEM_NOT_FOUND: true;
	// AI
	AI_QUOTA_EXCEEDED: true;
	AI_USAGE_NOT_RESERVED: true;
	AI_USAGE_NOT_REFUNDABLE: true;
	// Workspace
	WORKSPACE_NOT_FOUND: true;
	// Import / Share / Webhooks
	IMPORT_JOB_NOT_FOUND: true;
	PUBLIC_SHARE_NOT_FOUND: true;
	PUBLIC_SHARE_EXPIRED: true;
	WEBHOOK_NONCE_REUSED: true;
}

/** Union of every registered error code. */
export type ErrorCode = keyof ErrorCodeRegistry;

/** Codes introduced in Phase 03. */
export const PHASE_03_ERROR_CODES = [
	'TASK_NOT_FOUND',
	'NOTE_NOT_FOUND',
	'NOTE_VERSION_CONFLICT',
	'HABIT_NOT_FOUND',
	'HABIT_CHECKIN_DUPLICATE',
	'EXPENSE_NOT_FOUND',
	'EXPENSE_AMOUNT_INVALID',
	'BUDGET_EXCEEDED',
	'CALENDAR_EVENT_NOT_FOUND',
	'CALENDAR_TIME_INVALID',
	'VAULT_ITEM_NOT_FOUND',
	'AI_QUOTA_EXCEEDED',
	'AI_USAGE_NOT_RESERVED',
	'AI_USAGE_NOT_REFUNDABLE',
	'WORKSPACE_NOT_FOUND',
	'IMPORT_JOB_NOT_FOUND',
	'PUBLIC_SHARE_NOT_FOUND',
	'PUBLIC_SHARE_EXPIRED',
	'WEBHOOK_NONCE_REUSED',
] as const satisfies ReadonlyArray<ErrorCode>;

export type Phase03ErrorCode = (typeof PHASE_03_ERROR_CODES)[number];
