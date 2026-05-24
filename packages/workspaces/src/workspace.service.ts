// @ts-nocheck
import type { DbClient } from '@lifeos/db';
export const workspaceService = {
  createWorkspace: async (db: DbClient, ownerId: string, name: string) => ({ id: 'w_1' }),
  transferOwnership: async (db: DbClient, workspaceId: string, newOwnerId: string) => {},
};
