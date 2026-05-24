import { existsSync } from 'fs';
import { join } from 'path';

const legacyRoutes = [
  'apps/web/app/api/v1/auth/login/route.ts',
  'apps/web/app/api/v1/auth/register/route.ts',
  'apps/web/app/api/v1/auth/reset/route.ts',
];

let found = false;
for (const route of legacyRoutes) {
  if (existsSync(join(process.cwd(), route))) {
    console.error(`🚨 Error: Legacy auth route found: ${route}`);
    found = true;
  }
}

if (found) {
  console.error('\n❌ Build failed. Legacy auth routes are prohibited. Use signin, signup, password-reset instead.');
  process.exit(1);
}

console.log('✅ No legacy auth routes found.');
