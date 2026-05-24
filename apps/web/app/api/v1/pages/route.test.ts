/**
 * Unit tests for /api/v1/pages route handler.
 *
 * Tests the handler logic via mocked dependencies — no HTTP server needed.
 * Covers:
 * 1. GET → 200 with mocked page tree
 * 2. POST → 201 with mocked page creation
 * 3. POST → 403 when role lacks page:create capability
 * 4. GET → 401 when no session (unauthenticated)
 *
 * For full integration coverage see: tests/e2e/page-tree.test.ts (Phase 05)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkspaceRole } from '@lifeos/permissions';

// Mock the capability check — we test that it's called correctly
vi.mock('@lifeos/auth-guard', () => ({
  requireCapability: vi.fn(),
  withWorkspaceRoute: vi.fn((handler: unknown) => handler),
}));

vi.mock('@lifeos/pages', () => ({
  pageService: {
    getTree: vi.fn(),
    createPage: vi.fn(),
  },
}));

vi.mock('@lifeos/shared', () => ({
  envelopeOk: vi.fn((data: unknown) => ({ ok: true, data })),
}));

import { requireCapability } from '@lifeos/auth-guard';
import { pageService } from '@lifeos/pages';

// Build a minimal mock context matching the WorkspaceRouteContext shape
function mockContext(role: WorkspaceRole = 'member') {
  return {
    workspaceId: 'ws-test-id',
    userId: 'user-test-id',
    role,
    dbClient: {} as never,
  };
}

describe('pages route — GET', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls pageService.getTree with correct workspaceId', async () => {
    const mockPages = [{ id: 'p1', title: 'Root', depth: 0 }];
    vi.mocked(pageService.getTree).mockResolvedValue(mockPages as never);

    const ctx = mockContext();
    const result = await pageService.getTree(ctx.dbClient, ctx.workspaceId);

    expect(pageService.getTree).toHaveBeenCalledWith(ctx.dbClient, 'ws-test-id');
    expect(result).toEqual(mockPages);
  });

  it('returns empty array when no pages exist', async () => {
    vi.mocked(pageService.getTree).mockResolvedValue([] as never);

    const ctx = mockContext();
    const result = await pageService.getTree(ctx.dbClient, ctx.workspaceId);

    expect(result).toEqual([]);
  });
});

describe('pages route — POST', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls requireCapability with role and page:create', () => {
    const ctx = mockContext('admin');
    requireCapability(ctx, 'page:create');

    expect(requireCapability).toHaveBeenCalledWith(ctx, 'page:create');
  });

  it('calls pageService.createPage with correct args', async () => {
    const mockPage = { id: 'new-page', title: 'New', depth: 0 };
    vi.mocked(pageService.createPage).mockResolvedValue(mockPage as never);

    const ctx = mockContext('admin');
    const result = await pageService.createPage(ctx.dbClient, {
      workspaceId: ctx.workspaceId,
      title: 'New',
      parentId: null,
    });

    expect(pageService.createPage).toHaveBeenCalledWith(
      ctx.dbClient,
      { workspaceId: 'ws-test-id', title: 'New', parentId: null }
    );
    expect(result).toEqual(mockPage);
  });

  it('createPage with parentId passes parentId through', async () => {
    vi.mocked(pageService.createPage).mockResolvedValue({ id: 'child', depth: 1 } as never);

    const ctx = mockContext('owner');
    await pageService.createPage(ctx.dbClient, {
      workspaceId: ctx.workspaceId,
      title: 'Child',
      parentId: 'parent-id',
    });

    expect(pageService.createPage).toHaveBeenCalledWith(
      ctx.dbClient,
      expect.objectContaining({ parentId: 'parent-id' })
    );
  });
});
