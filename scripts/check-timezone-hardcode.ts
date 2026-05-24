#!/usr/bin/env tsx
/**
 * check-timezone-hardcode.ts — Phase 01 active guard
 * Fails if `new Date(` appears outside the two allowed files (ADR 0004).
 *
 * Allowed locations:
 *   1. packages/shared/src/time/clock.ts
 *   2. packages/shared/src/logger/logger.ts
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, normalize } from 'path';

const ROOT = process.cwd();
const NEW_DATE_RE = /new Date\(/;
const failures: string[] = [];

const ALLOWED = [
	normalize(join(ROOT, 'packages', 'shared', 'src', 'time', 'clock.ts')),
	normalize(join(ROOT, 'packages', 'shared', 'src', 'logger', 'logger.ts')),
];

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
			if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
			const normalFull = normalize(full);
			if (ALLOWED.includes(normalFull)) continue;
			const content = readFileSync(full, 'utf8');
			if (NEW_DATE_RE.test(content)) {
				failures.push(`new Date() outside allowed files: ${full}`);
			}
		}
	}
}

scanDir(join(ROOT, 'packages'));
scanDir(join(ROOT, 'apps'));

if (failures.length > 0) {
	console.error('[check-timezone-hardcode] FAILED:');
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.error('[check-timezone-hardcode] OK');
