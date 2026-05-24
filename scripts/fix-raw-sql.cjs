const fs = require('fs');

// 1. user.repo.ts
const userRepoContent = `
import { db } from '@lifeos/db';

export const userRepo = {
  findUserByEmailForLogin: async (email: string) => {
    return db.oneOrNone<{ id: string, password_hash: string, status: string }>(
      'SELECT id, password_hash, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
  },
  recordLogin: async (userId: string) => {
    await db.none('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
  },
  findIdByEmail: async (email: string) => {
    return db.oneOrNone<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  },
  updatePassword: async (userId: string, hash: string) => {
    await db.none('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
  },
  markEmailVerified: async (userId: string) => {
    await db.none('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
  },
  createUser: async (id: string, email: string, hash: string) => {
    await db.none(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [id, email.toLowerCase(), hash]
    );
  },
  getProfile: async (userId: string) => {
    const rows = await db.any(
      \`SELECT u.id, u.email, u.display_name, p.avatar_url, p.timezone 
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1\`,
      [userId]
    );
    return rows[0];
  }
};
`;
fs.writeFileSync('packages/auth/src/user.repo.ts', userRepoContent);

// Add to auth/src/index.ts
let authIndex = fs.readFileSync('packages/auth/src/index.ts', 'utf8');
if (!authIndex.includes('user.repo')) {
    fs.writeFileSync('packages/auth/src/index.ts', authIndex + "\nexport * from './user.repo';\n");
}

// 2. update workspace.service.ts
let wsContent = `
import { db } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';

export const workspaceService = {
  listUserWorkspaces: async (userId: string) => {
    return db.any(
      \`SELECT w.id, w.slug, w.name, wm.role
       FROM workspaces w
       JOIN workspace_memberships wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND wm.removed_at IS NULL AND w.archived_at IS NULL\`,
      [userId]
    );
  },
  createWorkspace: async (userId: string, name: string, slug: string) => {
    const id = newUlid();
    const memId = newUlid();
    await db.tx(async (tx: any) => {
      await tx.none(
        \`INSERT INTO workspaces (id, slug, name, type, owner_user_id) VALUES ($1, $2, $3, 'team', $4)\`,
        [id, slug, name, userId]
      );
      await tx.none(
        \`INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')\`,
        [memId, id, userId]
      );
    });
    return { id, slug, name };
  }
};
`;
fs.writeFileSync('packages/workspaces/src/workspace.service.ts', wsContent);

// 3. update membership.service.ts
let memContent = `
import { db } from '@lifeos/db';

export const membershipService = {
  listMembers: async (tx: any, workspaceId: string) => {
    return tx.any(
      \`SELECT m.id, m.user_id, m.role, u.email, u.display_name
       FROM workspace_memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.workspace_id = $1 AND m.removed_at IS NULL\`,
      [workspaceId]
    );
  },
  removeMember: async (tx: any, workspaceId: string, userId: string) => {
    await tx.none(
      \`UPDATE workspace_memberships SET removed_at = now() WHERE workspace_id = $1 AND user_id = $2\`,
      [workspaceId, userId]
    );
  }
};
`;
fs.writeFileSync('packages/workspaces/src/membership.service.ts', memContent);

// 4. Update the routes
function replaceInFile(path, oldText, newText) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(oldText, newText);
    fs.writeFileSync(path, content);
}

// login
let loginCode = fs.readFileSync('apps/web/app/api/v1/auth/login/route.ts', 'utf8');
loginCode = loginCode.replace("import { verifyPassword, createSession } from '@lifeos/auth';", "import { verifyPassword, createSession, userRepo } from '@lifeos/auth';");
loginCode = loginCode.replace(/const user = await db\.oneOrNone[\s\S]+?\]\n    \);/g, "const user = await userRepo.findUserByEmailForLogin(email);");
loginCode = loginCode.replace(/await db\.none\(`UPDATE users SET last_login_at = now\(\) WHERE id = \$1`, \[user\.id\]\);/g, "await userRepo.recordLogin(user.id);");
fs.writeFileSync('apps/web/app/api/v1/auth/login/route.ts', loginCode);

// logout
if (fs.existsSync('apps/web/app/api/v1/auth/logout/route.ts')) {
    let logoutCode = fs.readFileSync('apps/web/app/api/v1/auth/logout/route.ts', 'utf8');
    logoutCode = logoutCode.replace(/await db\.none\(`UPDATE sessions[\s\S]+?\[tokenHash\]\);/g, "await revokeSession(token);");
    logoutCode = logoutCode.replace("import { db } from '@lifeos/db';", "import { revokeSession } from '@lifeos/auth';");
    fs.writeFileSync('apps/web/app/api/v1/auth/logout/route.ts', logoutCode);
}

// magic-link/request
let mlCode = fs.readFileSync('apps/web/app/api/v1/auth/magic-link/request/route.ts', 'utf8');
mlCode = mlCode.replace("import { createMagicLink } from '@lifeos/auth';", "import { createMagicLink, userRepo } from '@lifeos/auth';");
mlCode = mlCode.replace(/const user = await db\.oneOrNone[\s\S]+?\]\);/g, "const user = await userRepo.findIdByEmail(email);");
fs.writeFileSync('apps/web/app/api/v1/auth/magic-link/request/route.ts', mlCode);

// password-reset/request
let prReqCode = fs.readFileSync('apps/web/app/api/v1/auth/password-reset/request/route.ts', 'utf8');
prReqCode = prReqCode.replace("import { createPasswordReset } from '@lifeos/auth';", "import { createPasswordReset, userRepo } from '@lifeos/auth';");
prReqCode = prReqCode.replace(/const user = await db\.oneOrNone[\s\S]+?\]\);/g, "const user = await userRepo.findIdByEmail(email);");
fs.writeFileSync('apps/web/app/api/v1/auth/password-reset/request/route.ts', prReqCode);

// password-reset/confirm
let prConfirmCode = fs.readFileSync('apps/web/app/api/v1/auth/password-reset/confirm/route.ts', 'utf8');
prConfirmCode = prConfirmCode.replace("import { consumePasswordReset, hashPassword, rotateOnPrivilegeChange } from '@lifeos/auth';", "import { consumePasswordReset, hashPassword, rotateOnPrivilegeChange, userRepo } from '@lifeos/auth';");
prConfirmCode = prConfirmCode.replace(/await db\.none\('UPDATE users SET password_hash = \$1 WHERE id = \$2', \[hash, userId\]\);/g, "await userRepo.updatePassword(userId, hash);");
fs.writeFileSync('apps/web/app/api/v1/auth/password-reset/confirm/route.ts', prConfirmCode);

// verify-email
let veCode = fs.readFileSync('apps/web/app/api/v1/auth/verify-email/route.ts', 'utf8');
veCode = veCode.replace("import { consumeEmailVerification } from '@lifeos/auth';", "import { consumeEmailVerification, userRepo } from '@lifeos/auth';");
veCode = veCode.replace(/await db\.none\('UPDATE users SET email_verified = true WHERE id = \$1', \[userId\]\);/g, "await userRepo.markEmailVerified(userId);");
fs.writeFileSync('apps/web/app/api/v1/auth/verify-email/route.ts', veCode);

// me
let meCode = fs.readFileSync('apps/web/app/api/v1/me/route.ts', 'utf8');
meCode = meCode.replace("import { db } from '@lifeos/db';", "import { userRepo } from '@lifeos/auth';");
meCode = meCode.replace(/const rows = await db\.many\([\s\S]+?\]\n    \);/g, "const data = await userRepo.getProfile(userId);");
meCode = meCode.replace("data: rows[0]", "data");
fs.writeFileSync('apps/web/app/api/v1/me/route.ts', meCode);

// register
if (fs.existsSync('apps/web/app/api/v1/auth/register/route.ts')) {
    let regCode = fs.readFileSync('apps/web/app/api/v1/auth/register/route.ts', 'utf8');
    regCode = regCode.replace("import { db } from '@lifeos/db';", "import { userRepo } from '@lifeos/auth';");
    regCode = regCode.replace(/await db\.none\(\n      `INSERT INTO users[\s\S]+?\]\n    \);/g, "await userRepo.createUser(userId, email, hash);");
    fs.writeFileSync('apps/web/app/api/v1/auth/register/route.ts', regCode);
}

// workspaces
let wsRouteCode = fs.readFileSync('apps/web/app/api/v1/workspaces/route.ts', 'utf8');
wsRouteCode = wsRouteCode.replace("import { db } from '@lifeos/db';", "import { workspaceService } from '@lifeos/workspaces';");
wsRouteCode = wsRouteCode.replace(/const rows = await db\.many\([\s\S]+?\]\n    \);/g, "const rows = await workspaceService.listUserWorkspaces(userId);");
wsRouteCode = wsRouteCode.replace(/await db\.none\('BEGIN'\);[\s\S]+?await db\.none\('COMMIT'\);/g, "const { id, slug: resSlug, name: resName } = await workspaceService.createWorkspace(userId, name, slug);");
wsRouteCode = wsRouteCode.replace(/data: { id, slug, name }/g, "data: { id, slug: resSlug, name: resName }");
wsRouteCode = wsRouteCode.replace(/await db\.none\('ROLLBACK'\);/g, "");
fs.writeFileSync('apps/web/app/api/v1/workspaces/route.ts', wsRouteCode);

// workspaces/[id]/members/[userId]
let rmRouteCode = fs.readFileSync('apps/web/app/api/v1/workspaces/[id]/members/[userId]/route.ts', 'utf8');
rmRouteCode = rmRouteCode.replace("import { db } from '@lifeos/db';", "import { membershipService } from '@lifeos/workspaces';");
rmRouteCode = rmRouteCode.replace(/await db\.none\([\s\S]+?\]\n    \);/g, "await membershipService.removeMember(dbClient, workspaceId, targetUserId);");
fs.writeFileSync('apps/web/app/api/v1/workspaces/[id]/members/[userId]/route.ts', rmRouteCode);
