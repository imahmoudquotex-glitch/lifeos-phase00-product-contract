import type { ErrorCode } from './codes';

export class AppError extends Error {
	readonly code: ErrorCode | string;
	readonly metadata?: Record<string, unknown>;
	constructor(code: ErrorCode | string, message?: string, metadata?: Record<string, unknown>) {
		super(message ?? code);
		this.name = 'AppError';
		this.code = code;
		if (metadata) this.metadata = metadata;
	}
}
