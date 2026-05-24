// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route/withWorkspaceRoute';
import { CAPABILITIES } from '@lifeos/permissions';
import { assertCapability } from '@lifeos/permissions/resolver';

export const GET = withWorkspaceRoute(async (req, params, { dbClient, workspaceId }) => {
  const result = await dbClient.query(
    `SELECT id, title, slug, parent_id, depth, position 
     FROM pages 
     WHERE workspace_id = $1 AND is_deleted = false
     ORDER BY depth ASC, position ASC`,
    [workspaceId]
  );
  return NextResponse.json({ ok: true, data: result.rows });
});

export const POST = withWorkspaceRoute(async (req, params, { dbClient, workspaceId, role, userId }) => {
  assertCapability(role as any, CAPABILITIES.PAGE_CREATE);
  
  const { title, slug, parentId } = await req.json();
  const id = (await import('@lifeos/shared/ids')).newUlid();
  
  await dbClient.query(
    `INSERT INTO pages (id, workspace_id, parent_id, title, slug, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, workspaceId, parentId || null, title, slug, userId]
  );
  
  return NextResponse.json({ ok: true, data: { id, title, slug } });
});
