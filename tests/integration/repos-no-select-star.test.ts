import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

function walk(dir: string, ext: string, out: string[] = []): string[] {
	try {
		for (const e of readdirSync(dir)) {
			if (['node_modules', '.git', '.next', 'dist', '.turbo'].includes(e)) continue;
			const p = join(dir, e);
			if (statSync(p).isDirectory()) walk(p, ext, out);
			else if (p.endsWith(ext)) out.push(p);
		}
	} catch { /* directory may not exist */ }
	return out;
}

describe('no repo file contains SELECT *', () => {
	it('walks all .repo.ts files and finds no SELECT *', () => {
		const roots = [
			join(process.cwd(), 'packages', 'services', 'src'),
			join(process.cwd(), 'packages', 'repo', 'src'),
		];
		const offenders: string[] = [];
		for (const root of roots) {
			for (const f of walk(root, '.repo.ts')) {
				const src = readFileSync(f, 'utf8');
				if (/SELECT\s+\*/i.test(src)) offenders.push(f);
			}
		}
		expect(offenders).toEqual([]);
	});
});

describe('no route file contains direct SQL', () => {
	it('walks all route.ts files and finds no db.query / db.one in route handlers', () => {
		const routesDir = join(process.cwd(), 'apps', 'web', 'src', 'app', 'api');
		const offenders: string[] = [];
		for (const f of walk(routesDir, 'route.ts')) {
			const src = readFileSync(f, 'utf8');
			// Routes should never call db directly — must use services
			if (/\bdb\.(one|many|none|query|oneOrNone|tx)\b/.test(src)) offenders.push(f);
		}
		expect(offenders).toEqual([]);
	});
});
