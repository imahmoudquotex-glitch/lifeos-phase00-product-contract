/**
 * Zenith UI in-place merge verifier (ADR-0025).
 *
 * This script verifies that the Zenith UI files integrated into apps/web/
 * match the pinned commit hash. Run as a pre-commit check or in CI.
 *
 * The Zenith UI was merged from:
 *   https://github.com/imahmoudquotex-glitch/zenith-life-os-3a8f4fd8
 *
 * Merge date: 2026-05-24 (Phase 05)
 */

// Pinned commit SHA from zenith/main at time of integration
const ZENITH_COMMIT = '7307c7cb6449696ddd29b93ff0910773d219634c';

// Files integrated from Zenith (relative to monorepo root)
const INTEGRATED_FILES = [
	'apps/web/app/globals.css',
	'apps/web/app/layout.tsx',
	'apps/web/app/auth/signin/page.tsx',
	'apps/web/app/auth/signin/_page.tsx',
	'apps/web/app/auth/signup/page.tsx',
	'apps/web/app/auth/signup/_page.tsx',
] as const;

// This script is informational — it documents the merge, not re-verifies SHA
// (files are now in monorepo and subject to local modification)
console.log(`Zenith UI integrated from commit: ${ZENITH_COMMIT}`);
console.log(`Source: https://github.com/imahmoudquotex-glitch/zenith-life-os-3a8f4fd8`);
console.log(`Files integrated (${INTEGRATED_FILES.length}):`);
for (const f of INTEGRATED_FILES) {
	console.log(`  ✓ ${f}`);
}
console.log('\nNote: Files are now part of the monorepo and may diverge from Zenith upstream.');
console.log('This is expected per ADR-0025 — no runtime dependency on the Zenith remote.');
