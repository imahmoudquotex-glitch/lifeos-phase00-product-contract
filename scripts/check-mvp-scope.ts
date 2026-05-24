/**
 * MVP scope gate.
 * Source of truth: docs/product/mvp-scope.md + this file (1:1 mapping enforced by the test).
 */
export const MVP_ALLOWED = new Set<string>([
  'auth',
  'workspace',
  'dashboard',
  'pages',
  'notes',
  'tasks',
  'habits',
  'finance',
  'goals',
  'calendar',
  'search',
  'ai-gateway',
  'vault',
  'settings',
  'pwa',
]);

export class PostMvpFeatureError extends Error {
  readonly code = 'POST_MVP_FEATURE';
  constructor(feature: string) {
    super(`POST_MVP_FEATURE: ${feature} is outside MVP scope`);
    this.name = 'PostMvpFeatureError';
  }
}

export function isMvpFeature(feature: string): boolean {
  return MVP_ALLOWED.has(feature);
}

export function assertMvpFeature(feature: string): void {
  if (!isMvpFeature(feature)) {
    throw new PostMvpFeatureError(feature);
  }
}

// CLI: pnpm tsx scripts/check-mvp-scope.ts <feature>
if (process.argv[1]?.endsWith('check-mvp-scope.ts')) {
  const feature = process.argv[2];
  if (!feature) {
    console.error('Usage: check-mvp-scope.ts <feature>');
    process.exit(2);
  }
  try {
    assertMvpFeature(feature);
    console.log(`OK: "${feature}" is in MVP scope`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
