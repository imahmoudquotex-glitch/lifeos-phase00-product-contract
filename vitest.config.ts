import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
	test: {
		environment: 'node',
		include: [
			'packages/**/*.test.ts',
			'apps/**/*.test.ts',
			'scripts/**/*.test.ts',
		],
		exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['packages/**/src/**/*.ts'],
			exclude: ['**/*.test.ts', '**/index.ts'],
		},
	},
	resolve: {
		alias: {
			'@lifeos/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
			'@lifeos/result': fileURLToPath(new URL('./packages/result/src/index.ts', import.meta.url)),
			'@lifeos/db': fileURLToPath(new URL('./packages/db/src/index.ts', import.meta.url)),
			'@lifeos/route': fileURLToPath(new URL('./packages/route/src/index.ts', import.meta.url)),
		},
	},
});
