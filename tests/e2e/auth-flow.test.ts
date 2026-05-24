/**
 * E2E: Authentication Flow
 *
 * WIRED-WHEN: Phase 05 — HTTP server integration (Next.js + real Postgres)
 *
 * Tests the full authentication journey:
 * 1. POST /api/v1/auth/login → success returns session token + cookie
 * 2. POST /api/v1/auth/login with bad credentials → 401 INVALID_CREDENTIALS
 * 3. GET /api/v1/me with valid session cookie → 200 { ok: true, data: { userId, email } }
 * 4. GET /api/v1/me without session → 401 UNAUTHENTICATED
 * 5. POST /api/v1/auth/logout → clears session cookie, subsequent GET /me returns 401
 *
 * Prerequisites:
 * - TEST_BASE_URL env pointing to running Next.js server
 * - DATABASE_URL pointing to a test Neon branch (seeded with test user)
 * - test user: email=test@example.com, password=TestPass123!
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env['TEST_BASE_URL'] ?? 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPass123!';

// WIRED-WHEN: Phase 05 — remove skip and set up test user seed
describe.skip('E2E: auth flow', () => {
  let sessionCookie: string;

  it('POST /api/v1/auth/login → 200 with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { userId: string } };
    expect(body.ok).toBe(true);
    expect(typeof body.data.userId).toBe('string');
    // Extract session cookie for subsequent requests
    sessionCookie = res.headers.get('set-cookie') ?? '';
    expect(sessionCookie).toBeTruthy();
  });

  it('POST /api/v1/auth/login → 401 with invalid password', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'wrong-password' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as { ok: false; error: { code: string } };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/me → 200 with valid session', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/me`, {
      headers: { Cookie: sessionCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { email: string } };
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe(TEST_EMAIL);
  });

  it('GET /api/v1/me → 401 without session', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/me`);
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/logout → clears session', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    expect(logoutRes.status).toBe(200);

    // Subsequent request with old cookie should return 401
    const meRes = await fetch(`${BASE_URL}/api/v1/me`, {
      headers: { Cookie: sessionCookie },
    });
    expect(meRes.status).toBe(401);
  });
});
