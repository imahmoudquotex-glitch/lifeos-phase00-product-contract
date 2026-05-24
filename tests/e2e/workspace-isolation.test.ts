/**
 * E2E: Workspace Isolation
 *
 * WIRED-WHEN: Phase 05 — HTTP server integration (Next.js + real Postgres)
 *
 * Tests that workspace access control is correctly enforced at the HTTP boundary:
 * 1. Non-member accessing a workspace URL returns 404 (NOT 403) — per ADR 0008
 * 2. Member accessing their workspace returns 200
 * 3. Cross-workspace data isolation: user A cannot read user B's pages
 * 4. Invitation token for workspace X does not grant access to workspace Y
 *
 * Prerequisites:
 * - TEST_BASE_URL env pointing to running Next.js server
 * - DATABASE_URL pointing to a test Neon branch (seeded with two workspaces + two users)
 * - User A: email=member-a@example.com, member of workspace-a ONLY
 * - User B: email=member-b@example.com, member of workspace-b ONLY
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env['TEST_BASE_URL'] ?? 'http://localhost:3000';

// Helper: get session cookie for a user
async function getSessionCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get('set-cookie') ?? '';
}

// WIRED-WHEN: Phase 05 — remove skip and seed test workspaces
describe.skip('E2E: workspace isolation', () => {
  const WORKSPACE_A_ID = process.env['TEST_WORKSPACE_A_ID'] ?? 'test-workspace-a-id';
  const WORKSPACE_B_ID = process.env['TEST_WORKSPACE_B_ID'] ?? 'test-workspace-b-id';

  it('non-member GET /api/v1/workspaces/:id → 404 (not 403) per ADR 0008', async () => {
    const cookieA = await getSessionCookie('member-a@example.com', 'TestPass123!');
    // User A tries to access Workspace B (not a member)
    const res = await fetch(`${BASE_URL}/api/v1/workspaces/${WORKSPACE_B_ID}`, {
      headers: { Cookie: cookieA },
    });
    // CRITICAL: must be 404, NOT 403, to prevent workspace enumeration
    expect(res.status).toBe(404);
    const body = await res.json() as { ok: false; error: { code: string } };
    expect(body.error.code).toBe('WORKSPACE_NOT_FOUND');
  });

  it('member GET /api/v1/workspaces/:id → 200', async () => {
    const cookieA = await getSessionCookie('member-a@example.com', 'TestPass123!');
    const res = await fetch(`${BASE_URL}/api/v1/workspaces/${WORKSPACE_A_ID}`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { id: string } };
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(WORKSPACE_A_ID);
  });

  it('cross-workspace: user A cannot read pages of workspace B', async () => {
    const cookieA = await getSessionCookie('member-a@example.com', 'TestPass123!');
    // Attempt to list pages for workspace B
    const res = await fetch(`${BASE_URL}/api/v1/pages?workspaceId=${WORKSPACE_B_ID}`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(404);
  });

  it('unauthenticated GET /api/v1/workspaces/:id → 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/workspaces/${WORKSPACE_A_ID}`);
    expect(res.status).toBe(401);
  });
});
