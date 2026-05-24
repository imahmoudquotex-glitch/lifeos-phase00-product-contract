import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertMvpFeature,
  isMvpFeature,
  MVP_ALLOWED,
  PostMvpFeatureError,
} from '../check-mvp-scope';

const DOCUMENTED = [
  'auth', 'workspace', 'dashboard', 'pages', 'notes',
  'tasks', 'habits', 'finance', 'goals', 'calendar',
  'search', 'ai-gateway', 'vault', 'settings', 'pwa',
] as const;

describe('check-mvp-scope', () => {
  it('lists exactly 15 MVP features', () => {
    expect(MVP_ALLOWED.size).toBe(15);
  });

  it('accepts every documented MVP feature', () => {
    for (const f of DOCUMENTED) {
      expect(isMvpFeature(f)).toBe(true);
    }
  });

  it('rejects Post-MVP features with PostMvpFeatureError', () => {
    expect(() => assertMvpFeature('billing')).toThrow(PostMvpFeatureError);
    expect(() => assertMvpFeature('marketplace')).toThrow(/POST_MVP_FEATURE/);
    expect(() => assertMvpFeature('mobile-native')).toThrow(/POST_MVP_FEATURE/);
  });
});

describe('MVP docs and script stay aligned (strict 1:1, no aliases)', () => {
  const md = readFileSync('docs/product/mvp-scope.md', 'utf8');

  // Extract first cell of every data row in the table (skip header + separator)
  function extractKeys(markdown: string): string[] {
    return markdown
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .filter((l) => !l.includes('---'))
      .filter((l) => !/feature\s*key/i.test(l))
      .map((l) => l.split('|')[1]?.trim() ?? '')
      .filter(Boolean);
  }

  const documentedKeys = extractKeys(md);

  it('mvp-scope.md table has exactly 15 rows', () => {
    expect(documentedKeys.length).toBe(15);
  });

  it('every key in MVP_ALLOWED appears in mvp-scope.md (no aliases)', () => {
    const docSet = new Set(documentedKeys);
    for (const key of MVP_ALLOWED) {
      expect(docSet.has(key)).toBe(true);
    }
  });

  it('every row in mvp-scope.md exists in MVP_ALLOWED', () => {
    for (const key of documentedKeys) {
      expect(MVP_ALLOWED.has(key)).toBe(true);
    }
  });
});
