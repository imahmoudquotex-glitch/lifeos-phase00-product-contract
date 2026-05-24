import { defineConfig } from 'vitest/config';

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
			'@lifeos/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
			'@lifeos/result': new URL('./packages/result/src/index.ts', import.meta.url).pathname,
			'@lifeos/db': new URL('./packages/db/src/index.ts', import.meta.url).pathname,
			'@lifeos/route': new URL('./packages/route/src/index.ts', import.meta.url).pathname,
		},
	},
});
