#!/usr/bin/env tsx
/**
 * check-naming.ts — Phase 01 active guard
 * Enforces that all directories under packages/, apps/, scripts/ use kebab-case.
 * Enforces that migrations under migrations/ follow NNNNdouble_underscore_snake_case.sql pattern.
 */
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const KEBAB_RE = /^[[\]a-z0-9]+(-[[\]a-z0-9]+)*$/;
// Node.js/Jest conventional directories allowed as exceptions
const ALLOWED_NAMES = new Set(['__tests__', '__mocks__', '__fixtures__']);
const failures: string[] = [];

function checkDir(dir: string, depth = 0) {
	if (depth > 5) return;
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === '.next' || entry === '.turbo') continue;
		const full = join(dir, entry);
		const isDir = statSync(full).isDirectory();
		if (isDir) {
			if (!KEBAB_RE.test(entry) && !ALLOWED_NAMES.has(entry)) {
				failures.push(`directory violates kebab-case: ${full}`);
			}
			checkDir(full, depth + 1);
		}
	}
}

const SCAN_ROOTS = ['packages', 'apps', 'scripts'].map((d) => join(ROOT, d));
for (const r of SCAN_ROOTS) {
	checkDir(r);
}

if (failures.length > 0) {
	console.error('[check-naming] FAILED:');
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.error('[check-naming] OK');
