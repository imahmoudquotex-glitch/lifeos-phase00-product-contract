import { computeBodyHash } from './body-hash';
import { AppError, systemClock } from '@lifeos/shared';

export type OutboxRecord = {
	id: string;
	method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	url: string;
	headers: Record<string, string>;
	body: string; // serialized JSON
	bodyHash: string; // SHA-256 hex of canonical body
	attempts: number;
	nextAttemptAt: number; // epoch ms
	createdAt: number;
	lastError?: string;
};

export function buildOutboxRecord(
	input: Omit<OutboxRecord, 'bodyHash' | 'attempts' | 'nextAttemptAt' | 'createdAt'>,
): OutboxRecord {
	const now = systemClock.nowMs();
	return {
		...input,
		bodyHash: computeBodyHash(input.body),
		attempts: 0,
		nextAttemptAt: now,
		createdAt: now,
	};
}

/**
 * Verify the outbox record was not tampered with in IndexedDB.
 * MUST be called before flushing to network.
 */
export function verifyOutboxIntegrity(rec: OutboxRecord): void {
	const expected = computeBodyHash(rec.body);
	if (expected !== rec.bodyHash) {
		throw new AppError(
			'OUTBOX_BODY_HASH_MISMATCH',
			`Outbox record ${rec.id} integrity check failed.`,
		);
	}
}
