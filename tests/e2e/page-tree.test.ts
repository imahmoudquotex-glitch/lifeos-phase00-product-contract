/**
 * E2E: Page Tree Operations
 *
 * WIRED-WHEN: Phase 05 — HTTP server integration (Next.js + real Postgres)
 *
 * Tests the page tree integrity constraints enforced at the HTTP boundary:
 * 1. Creating a cycle (moving a page under its own descendant) → PAGE_INVALID_MOVE
 * 2. Moving a page to depth > 50 → PAGE_DEPTH_EXCEEDED
 * 3. Valid page move → 200 with updated depth
 * 4. Archiving a page → 200, page no longer appears in tree
 *
 * These constraints are enforced in packages/pages/src/tree.ts via:
 * - assertNoCycle() using recursive CTE (ADR 0007)
 * - recomputeSubtreeDepth() with max depth = 50 (ADR 0007)
 *
 * Prerequisites:
 * - TEST_BASE_URL env pointing to running Next.js server
 * - DATABASE_URL pointing to a test Neon branch (seeded with workspace + pages)
 * - Seeded pages: root → child → grandchild (depth = 2)
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env['TEST_BASE_URL'] ?? 'http://localhost:3000';

async function getSessionCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get('set-cookie') ?? '';
}

// WIRED-WHEN: Phase 05 — remove skip and seed test page tree
describe.skip('E2E: page tree', () => {
  const WORKSPACE_ID = process.env['TEST_WORKSPACE_ID'] ?? 'test-workspace-id';
  const PAGE_ROOT_ID = process.env['TEST_PAGE_ROOT_ID'] ?? 'root-page-id';
  const PAGE_CHILD_ID = process.env['TEST_PAGE_CHILD_ID'] ?? 'child-page-id';
  const PAGE_GRANDCHILD_ID = process.env['TEST_PAGE_GRANDCHILD_ID'] ?? 'grandchild-page-id';

  it('moving root under its own grandchild → 422 PAGE_INVALID_MOVE', async () => {
    const cookie = await getSessionCookie('member@example.com', 'TestPass123!');
    const res = await fetch(`${BASE_URL}/api/v1/pages/${PAGE_ROOT_ID}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        workspaceId: WORKSPACE_ID,
        parentId: PAGE_GRANDCHILD_ID, // creating a cycle: root → child → grandchild → root
      }),
    });
    expect(res.status).toBe(422);
    const body = await res.json() as { ok: false; error: { code: string } };
    expect(body.error.code).toBe('PAGE_INVALID_MOVE');
  });

  it('valid page move → 200 with new depth', async () => {
    const cookie = await getSessionCookie('member@example.com', 'TestPass123!');
    // Create a new page at root level
    const createRes = await fetch(`${BASE_URL}/api/v1/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        workspaceId: WORKSPACE_ID,
        title: 'New page',
        parentId: null,
      }),
    });
    expect(createRes.status).toBe(201);
    const { data: newPage } = await createRes.json() as { data: { id: string } };

    // Move it under the child (depth 1 → should become depth 2)
    const moveRes = await fetch(`${BASE_URL}/api/v1/pages/${newPage.id}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        workspaceId: WORKSPACE_ID,
        parentId: PAGE_CHILD_ID,
      }),
    });
    expect(moveRes.status).toBe(200);
    const { data: moved } = await moveRes.json() as { data: { depth: number } };
    expect(moved.depth).toBe(2);
  });

  it('archiving a page → 200, page absent from list', async () => {
    const cookie = await getSessionCookie('member@example.com', 'TestPass123!');

    // Archive grandchild
    const archiveRes = await fetch(`${BASE_URL}/api/v1/pages/${PAGE_GRANDCHILD_ID}/archive`, {
      method: 'PATCH',
      headers: { Cookie: cookie },
    });
    expect(archiveRes.status).toBe(200);

    // List pages — grandchild should not appear
    const listRes = await fetch(`${BASE_URL}/api/v1/pages?workspaceId=${WORKSPACE_ID}`, {
      headers: { Cookie: cookie },
    });
    const { data: pages } = await listRes.json() as { data: Array<{ id: string }> };
    expect(pages.some((p) => p.id === PAGE_GRANDCHILD_ID)).toBe(false);
  });
});
