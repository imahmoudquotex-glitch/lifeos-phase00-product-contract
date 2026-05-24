import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before import
vi.mock('@lifeos/db', () => ({
	db: {
		oneOrNone: vi.fn(),
		none: vi.fn(),
		tx: vi.fn(async (cb) => cb({ none: vi.fn() })),
	},
}));
vi.mock('@lifeos/shared', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@lifeos/shared')>();
	return {
		...actual,
		systemClock: { nowMs: () => 1716556800000 },
		newUlid: () => 'test-ulid-01',
	};
});
vi.mock('@lifeos/security', () => ({
	computeEventHash: vi.fn(() => 'testhash-0000'),
}));

import { signInWithPassword } from '../../packages/auth/src/sign-in-with-password';

describe('signInWithPassword', () => {
	beforeEach(() => vi.clearAllMocks());

	it('throws AUTH_INVALID_CREDENTIALS when user not found', async () => {
		const { db } = await import('@lifeos/db');
		vi.mocked(db.oneOrNone).mockResolvedValueOnce(null);

		await expect(
			signInWithPassword('missing@example.com', 'pass', 'fp1', 'ua1'),
		).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
	});

	it('throws AUTH_ACCOUNT_LOCKED when locked_at is set', async () => {
		const { db } = await import('@lifeos/db');
		vi.mocked(db.oneOrNone).mockResolvedValueOnce({
			id: 'user-1',
			workspace_id: 'ws-1',
			password_hash: '$argon2id$...',
			locale: 'en',
			locked_at: new Date(),
		});

		await expect(
			signInWithPassword('locked@example.com', 'pass', 'fp1', 'ua1'),
		).rejects.toMatchObject({ code: 'AUTH_ACCOUNT_LOCKED' });
	});

	it('returns sessionId + locale on valid credentials', async () => {
		const { db } = await import('@lifeos/db');
		vi.mocked(db.oneOrNone)
			.mockResolvedValueOnce({
				id: 'user-1',
				workspace_id: 'ws-1',
				password_hash: '$argon2id$real',
				locale: 'ar',
				locked_at: null,
			})
			// audit prev hash query
			.mockResolvedValueOnce({ event_hash: 'prevhash' });
		vi.mocked(db.none).mockResolvedValue(undefined);

		// Mock verifyPassword to return true
		vi.doMock('../../packages/auth/src/password', () => ({
			verifyPassword: vi.fn(async () => true),
		}));
		vi.doMock('../../packages/auth/src/session', () => ({
			createSession: vi.fn(async () => ({ id: 'session-abc' })),
		}));

		// Re-import to pick up doMock
		const { signInWithPassword: siwp } = await import('../../packages/auth/src/sign-in-with-password');
		const result = await siwp('user@example.com', 'correct', 'fp', 'ua');
		expect(result).toMatchObject({ userId: 'user-1', workspaceId: 'ws-1', locale: 'ar' });
	});
});
