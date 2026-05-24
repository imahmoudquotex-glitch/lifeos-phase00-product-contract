export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export const CAPABILITIES = {
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  MEMBER_LIST: 'member:list',
  MEMBER_UPDATE: 'member:update',
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  INVITATION_LIST: 'invitation:list',
  INVITATION_CREATE: 'invitation:create',
  INVITATION_REVOKE: 'invitation:revoke',
  PAGE_VIEW: 'page:view',
  PAGE_CREATE: 'page:create',
  PAGE_UPDATE: 'page:update',
  PAGE_DELETE: 'page:delete',

  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',

  NOTE_CREATE: 'note:create',
  NOTE_UPDATE: 'note:update',
  NOTE_DELETE: 'note:delete',
  NOTE_READ_HISTORY: 'note:read-version-history',

  HABIT_CREATE: 'habit:create',
  HABIT_DELETE: 'habit:delete',
  HABIT_CHECKIN: 'habit:checkin',

  EXPENSE_CREATE: 'expense:create',
  BUDGET_SET: 'budget:set',
  EXPENSE_UPDATE: 'expense:update',

  CALENDAR_CREATE: 'calendar:create',
  CALENDAR_UPDATE: 'calendar:update',
  CALENDAR_DELETE: 'calendar:delete',

  VAULT_CREATE_META: 'vault:create-meta',
  VAULT_READ_META: 'vault:read-meta',

  AI_USE: 'ai:use',
  XP_AWARD: 'xp:award',

  SHARE_CREATE: 'share:create',
  SHARE_REVOKE: 'share:revoke',

  REVIEW_WRITE: 'review:write',

  IMPORT_START: 'import:start',
  IMPORT_READ: 'import:read',
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

export const ROLE_CAPABILITIES: Record<WorkspaceRole, Capability[]> = {
  owner: Object.values(CAPABILITIES) as Capability[],
  admin: Object.values(CAPABILITIES).filter(c => c !== 'workspace:delete') as Capability[],
  member: [
    CAPABILITIES.MEMBER_LIST,
    CAPABILITIES.INVITATION_LIST,
    CAPABILITIES.PAGE_VIEW,
    CAPABILITIES.PAGE_CREATE,
    CAPABILITIES.PAGE_UPDATE,
    CAPABILITIES.TASK_CREATE,
    CAPABILITIES.TASK_UPDATE,
    CAPABILITIES.TASK_DELETE,
    CAPABILITIES.NOTE_CREATE,
    CAPABILITIES.NOTE_UPDATE,
    CAPABILITIES.NOTE_DELETE,
    CAPABILITIES.NOTE_READ_HISTORY,
    CAPABILITIES.HABIT_CREATE,
    CAPABILITIES.HABIT_DELETE,
    CAPABILITIES.HABIT_CHECKIN,
    CAPABILITIES.EXPENSE_CREATE,
    CAPABILITIES.EXPENSE_UPDATE,
    CAPABILITIES.CALENDAR_CREATE,
    CAPABILITIES.CALENDAR_UPDATE,
    CAPABILITIES.CALENDAR_DELETE,
    CAPABILITIES.VAULT_CREATE_META,
    CAPABILITIES.VAULT_READ_META,
    CAPABILITIES.AI_USE,
    CAPABILITIES.SHARE_CREATE,
    CAPABILITIES.SHARE_REVOKE,
    CAPABILITIES.REVIEW_WRITE,
    CAPABILITIES.IMPORT_READ,
  ],
  viewer: [
    CAPABILITIES.MEMBER_LIST,
    CAPABILITIES.PAGE_VIEW,
    CAPABILITIES.NOTE_READ_HISTORY,
    CAPABILITIES.VAULT_READ_META,
    CAPABILITIES.IMPORT_READ,
  ]
};
