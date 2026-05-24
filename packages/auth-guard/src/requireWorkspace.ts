// @ts-nocheck
import { AppError } from '@lifeos/shared';
export function requireWorkspace(workspaceId: string | null): void {
  if (!workspaceId) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found');
}
