const fs = require('fs');

function updateDeps(pkgPath, deps) {
  const data = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  for (const dep of deps) {
    if (!data.dependencies) data.dependencies = {};
    data.dependencies[dep] = 'workspace:*';
  }
  fs.writeFileSync(pkgPath, JSON.stringify(data, null, 2) + '\n');
}

updateDeps('apps/web/package.json', [
  '@lifeos/auth', '@lifeos/auth-guard', '@lifeos/db', 
  '@lifeos/permissions', '@lifeos/workspaces', '@lifeos/pages'
]);

updateDeps('packages/auth/package.json', [
  '@lifeos/shared', '@lifeos/db', '@lifeos/permissions'
]);

updateDeps('packages/auth-guard/package.json', [
  '@lifeos/shared', '@lifeos/permissions'
]);

updateDeps('packages/workspaces/package.json', [
  '@lifeos/db', '@lifeos/shared', '@lifeos/permissions'
]);

updateDeps('packages/pages/package.json', [
  '@lifeos/db', '@lifeos/shared'
]);

// Fix resolver.ts import
const resolverPath = 'packages/permissions/src/resolver.ts';
let resContent = fs.readFileSync(resolverPath, 'utf8');
resContent = resContent.replace(/@lifeos\/shared\/errors/g, '@lifeos/shared');
fs.writeFileSync(resolverPath, resContent);
