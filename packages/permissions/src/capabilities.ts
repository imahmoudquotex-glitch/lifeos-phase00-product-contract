// @ts-nocheck
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export const CAPABILITIES = {
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  PAGE_CREATE: 'page:create',
  PAGE_UPDATE: 'page:update',
  PAGE_DELETE: 'page:delete',
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

export const ROLE_CAPABILITIES: Record<WorkspaceRole, Capability[]> = {
  owner: [
    CAPABILITIES.WORKSPACE_UPDATE,
    CAPABILITIES.WORKSPACE_DELETE,
    CAPABILITIES.MEMBER_INVITE,
    CAPABILITIES.MEMBER_REMOVE,
    CAPABILITIES.PAGE_CREATE,
    CAPABILITIES.PAGE_UPDATE,
    CAPABILITIES.PAGE_DELETE,
  ],
  admin: [
    CAPABILITIES.WORKSPACE_UPDATE,
    CAPABILITIES.MEMBER_INVITE,
    CAPABILITIES.PAGE_CREATE,
    CAPABILITIES.PAGE_UPDATE,
    CAPABILITIES.PAGE_DELETE,
  ],
  member: [
    CAPABILITIES.PAGE_CREATE,
    CAPABILITIES.PAGE_UPDATE,
  ],
  viewer: []
};
