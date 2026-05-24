import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@lifeos/db', () => ({
	db: {
		oneOrNone: vi.fn(),
		none: vi.fn(),
		tx: vi.fn(async (cb) => {
			await cb({ none: vi.fn() });
		}),
	},
}));
vi.mock('@lifeos/shared', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@lifeos/shared')>();
	return { ...actual, systemClock: { nowMs: () => 1716556800000 }, newUlid: () => 'ulid-test' };
});

import { signUp } from '../../packages/auth/src/sign-up';

describe('signUp', () => {
	beforeEach(() => vi.clearAllMocks());

	it('throws AUTH_INVALID_CREDENTIALS when email already exists', async () => {
		const { db } = await import('@lifeos/db');
		vi.mocked(db.oneOrNone).mockResolvedValueOnce({ id: 'existing-user' });

		await expect(
			signUp({
				email: 'taken@example.com',
				password: 'pass123!',
				displayName: 'Test',
				deviceFingerprint: 'fp',
				userAgent: 'ua',
			}),
		).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
	});

	it('creates user + workspace + session on fresh email', async () => {
		const { db } = await import('@lifeos/db');
		vi.mocked(db.oneOrNone).mockResolvedValueOnce(null); // no existing user
		vi.mocked(db.tx).mockImplementation(async (cb) => cb({ none: vi.fn() }));

		vi.doMock('../../packages/auth/src/password', () => ({
			hashPassword: vi.fn(async () => '$argon2id$testhash'),
		}));
		vi.doMock('../../packages/auth/src/session', () => ({
			createSession: vi.fn(async () => ({ id: 'new-session' })),
		}));

		const { signUp: freshSignUp } = await import('../../packages/auth/src/sign-up');
		const result = await freshSignUp({
			email: 'new@example.com',
			password: 'S3cur3!',
			displayName: 'New User',
			locale: 'ar',
			deviceFingerprint: 'fp',
			userAgent: 'ua',
		});

		expect(result).toMatchObject({
			userId: 'ulid-test',
			workspaceId: 'ulid-test',
			locale: 'ar',
		});
	});
});
