import { defineConfig } from 'vitest/config';

// NOTE (deviation-3 / D-013): stage0.md Step 21 specified
//   poolOptions: { threads: { singleThread: true } }
// That option was removed in vitest v4 (installed: v4.1.7).
// The 6 tests still pass without it. Phase 01 will pin vitest to
// the exact version used here and update this config accordingly.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['scripts/**/*.test.ts'],
		exclude: ['**/node_modules/**'],
		// poolOptions removed — deprecated in vitest ≥4; see D-013
	},
});
