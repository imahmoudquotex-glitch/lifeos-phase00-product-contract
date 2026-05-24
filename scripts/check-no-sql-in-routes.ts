#!/usr/bin/env tsx
/**
 * check-no-sql-in-routes.ts — Phase 01 active guard
 * Fails if any app route.ts file directly contains raw SQL strings (SELECT, INSERT, UPDATE, DELETE, WITH).
 * Route files must delegate to repository/service layer; SQL belongs in @lifeos/db or repository files.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const SQL_RE = /(['"`]\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|WITH)\b)/i;
const failures: string[] = [];

function scanDir(dir: string) {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (entry === 'node_modules' || entry === 'dist' || entry === '.next') continue;
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			scanDir(full);
		} else if (entry === 'route.ts' || entry === 'route.tsx') {
			const content = readFileSync(full, 'utf8');
			if (SQL_RE.test(content)) {
				failures.push(`SQL in route file: ${full}`);
			}
		}
	}
}

scanDir(join(ROOT, 'apps'));

if (failures.length > 0) {
	console.error('[check-no-sql-in-routes] FAILED:');
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.error('[check-no-sql-in-routes] OK');
