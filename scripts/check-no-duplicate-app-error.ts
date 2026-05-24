#!/usr/bin/env tsx
/**
 * check-no-duplicate-app-error.ts — Phase 01 active guard
 * Fails if `class AppError` appears in any file other than
 * packages/shared/src/errors/app-error.ts.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, normalize } from 'path';

const ROOT = process.cwd();
const APP_ERROR_RE = /class\s+AppError\s+extends/;
const failures: string[] = [];

const CANONICAL = normalize(
	join(ROOT, 'packages', 'shared', 'src', 'errors', 'app-error.ts'),
);

function scanDir(dir: string) {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry === 'node_modules' || entry === 'dist' || entry === '.next' || entry.startsWith('.')) continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			scanDir(full);
		} else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
			if (normalize(full) === CANONICAL) continue;
			const content = readFileSync(full, 'utf8');
			if (APP_ERROR_RE.test(content)) {
				failures.push(`Duplicate AppError class in: ${full}`);
			}
		}
	}
}

scanDir(join(ROOT, 'packages'));
scanDir(join(ROOT, 'apps'));
scanDir(join(ROOT, 'scripts'));

if (failures.length > 0) {
	console.error('[check-no-duplicate-app-error] FAILED:');
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.error('[check-no-duplicate-app-error] OK');
