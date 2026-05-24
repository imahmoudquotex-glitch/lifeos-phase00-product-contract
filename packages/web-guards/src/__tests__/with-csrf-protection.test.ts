import { describe, it, expect } from 'vitest';
import { withCsrfProtection } from '../../packages/web-guards/src/with-csrf-protection';

function makeMockReq(overrides: {
	method?: string;
	cookieCsrf?: string;
	headerCsrf?: string;
}) {
	const { method = 'POST', cookieCsrf = 'valid-token', headerCsrf = 'valid-token' } = overrides;
	return {
		method,
		cookies: {
			get: (name: string) => (name === 'lifeos_csrf' ? { value: cookieCsrf } : undefined),
		},
		headers: {
			get: (name: string) => (name === 'x-csrf-token' ? headerCsrf : null),
		},
	} as unknown as import('next/server').NextRequest;
}

const mockHandler = vi.fn(async () => new Response('OK', { status: 200 }));

describe('withCsrfProtection', () => {
	beforeEach(() => vi.clearAllMocks());

	it('allows GET requests without CSRF check', async () => {
		const req = makeMockReq({ method: 'GET' });
		const wrapped = withCsrfProtection(mockHandler);
		await wrapped(req);
		expect(mockHandler).toHaveBeenCalledOnce();
	});

	it('allows POST with matching cookie+header token', async () => {
		const req = makeMockReq({ method: 'POST', cookieCsrf: 'tok', headerCsrf: 'tok' });
		const wrapped = withCsrfProtection(mockHandler);
		const res = await wrapped(req);
		expect(res.status).toBe(200);
		expect(mockHandler).toHaveBeenCalledOnce();
	});

	it('blocks POST with mismatched token — returns 403', async () => {
		const req = makeMockReq({ method: 'POST', cookieCsrf: 'correct', headerCsrf: 'wrong' });
		const wrapped = withCsrfProtection(mockHandler);
		const res = await wrapped(req);
		expect(res.status).toBe(403);
		expect(mockHandler).not.toHaveBeenCalled();
	});

	it('blocks POST with missing cookie — returns 403', async () => {
		const req = makeMockReq({ method: 'POST', cookieCsrf: '', headerCsrf: 'tok' });
		const wrapped = withCsrfProtection(mockHandler);
		const res = await wrapped(req);
		expect(res.status).toBe(403);
	});
});
