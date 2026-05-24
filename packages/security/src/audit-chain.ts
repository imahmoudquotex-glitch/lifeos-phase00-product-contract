import { sha256 } from '@noble/hashes/sha2';
import { AppError } from '@lifeos/shared';

export const GENESIS_HASH = '0'.repeat(64);

export type AuditEventInput = {
	workspaceId: string;
	actorId: string;
	eventType: string;
	payload: Record<string, unknown>;
	occurredAt: string; // ISO
};

export type StoredAuditEvent = AuditEventInput & {
	id: string;
	prevHash: string; // from DB
	eventHash: string; // from DB
};

export function canonicalize(payload: Record<string, unknown>): string {
	const sortedKeys = Object.keys(payload).sort();
	const obj: Record<string, unknown> = {};
	for (const k of sortedKeys) obj[k] = payload[k];
	return JSON.stringify(obj);
}

export function computeEventHash(
	prevHash: string,
	ev: AuditEventInput,
): string {
	const material = [
		prevHash,
		ev.workspaceId,
		ev.actorId,
		ev.eventType,
		ev.occurredAt,
		canonicalize(ev.payload),
	].join('|');
	const h = sha256(new TextEncoder().encode(material));
	return Buffer.from(h).toString('hex');
}

/**
 * SECURE verification: recompute hash from payload + prevHash and compare
 * against DB-stored eventHash. A tampered payload yields a different hash,
 * even if the attacker also updated prevHash.
 *
 * Tamper detection works because the attacker would need to rewrite EVERY
 * subsequent event_hash in the DB — and the DB row is what we compare against,
 * not the incoming ev.prevHash blindly.
 */
export function verifyChain(events: StoredAuditEvent[]): boolean {
	let expectedPrev = GENESIS_HASH;
	for (const ev of events) {
		if (ev.prevHash !== expectedPrev) return false;
		const recomputed = computeEventHash(ev.prevHash, ev);
		if (recomputed !== ev.eventHash) return false; // ← tamper detected
		expectedPrev = ev.eventHash;
	}
	return true;
}

export function assertChain(events: StoredAuditEvent[]): void {
	if (!verifyChain(events)) {
		throw new AppError('AUDIT_CHAIN_BROKEN', 'Audit chain verification failed.');
	}
}
