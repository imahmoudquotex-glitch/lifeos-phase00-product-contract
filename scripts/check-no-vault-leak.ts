// scripts/check-no-vault-leak.ts
// Phase 04: CI gate for secret leaks — was placeholder in Phase 01, now active.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { scanTextForSecrets } from '@lifeos/security';

const ROOT = process.cwd();
const IGNORED = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage']);

function walk(dir: string, acc: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (IGNORED.has(name)) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, acc);
		else if (/\.(ts|tsx|js|jsx|json|env|sql|md)$/.test(name)) acc.push(full);
	}
	return acc;
}

const files = walk(ROOT);
const hits: string[] = [];
for (const f of files) {
	const rel = relative(ROOT, f).replace(/\\/g, '/');
	if (rel.startsWith('packages/security/src/scanner.ts')) continue; // skip patterns file itself
	if (rel.startsWith('packages/security/tests/scanner.test.ts')) continue; // skip test fixtures
	const text = readFileSync(f, 'utf-8');
	hits.push(...scanTextForSecrets(rel, text));
}

if (hits.length > 0) {
	console.error('❌ Secret scanner FAILED:');
	for (const h of hits) console.error('  - ' + h);
	process.exit(1);
}
console.log('✅ Secret scanner: OK');
