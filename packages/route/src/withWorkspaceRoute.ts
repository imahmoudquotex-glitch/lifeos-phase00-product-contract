import { NextResponse, type NextRequest } from 'next/server';
import { AppError, envelopeErr, statusForError } from '@lifeos/shared';
import { requireUser, requireWorkspace, validateCsrf } from '@lifeos/auth-guard';
import type { Capability, WorkspaceRole } from '@lifeos/permissions';
import { hasCapability } from '@lifeos/permissions';
import { getDb, type DbClient } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

export interface WorkspaceRouteContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  tx: DbClient;
}

export interface WithWorkspaceRouteOptions {
  capability?: Capability;
  csrfProtect?: boolean;
}


export async function withWorkspaceRoute<T>(
  req: NextRequest,
  rawWorkspaceId: string | undefined | null,
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<T>,
): Promise<T> {
  const userId = await requireUser(req);
  const workspaceId =
    req.headers.get('x-workspace-id')
    ?? req.nextUrl.searchParams.get('workspaceId')
    ?? rawWorkspaceId
    ?? null;

  if (!workspaceId) {
    throw new AppError('VALIDATION_FAILED', 'workspaceId is required (header or query param).');
  }

  const { role } = await requireWorkspace(userId, workspaceId);

  if (options.csrfProtect) {
    validateCsrf(req);
  }

  if (options.capability) {
    if (!hasCapability(role, options.capability)) {
      throw new AppError('AUTH_FORBIDDEN', `Missing capability: ${options.capability}`);
    }
  }

  const env = getServerEnv();
  const tx: DbClient = getDb(env.DATABASE_URL);

  return handler({ userId, workspaceId, role, tx });
}

export function createWorkspaceHandler(
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    { params }: { params: { workspaceId?: string; id?: string } },
  ): Promise<NextResponse> => {
    try {
      return await withWorkspaceRoute(
        req,
        params.workspaceId ?? null,
        options,
        handler,
      );
    } catch (e) {
      const err = e instanceof Error ? e : new AppError('UNKNOWN', 'Unexpected server error');
      const status = statusForError(err);
      return NextResponse.json(envelopeErr(err), { status });
    }
  };
}
