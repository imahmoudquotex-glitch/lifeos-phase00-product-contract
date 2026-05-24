#!/usr/bin/env ts-node
/**
 * scripts/design-drift.ts (8.1)
 * Phase 05 enhanced — checks for light-mode Tailwind/inline classes that violate ADR-0010 (dark-only).
 *
 * Forbidden patterns:
 * - bg-white, bg-gray-*, bg-slate-* without dark: prefix
 * - text-black, text-gray-* without dark: prefix
 * - Inline style={{ background: '#fff' | 'white' | 'rgb(255...'
 *
 * Legitimate exceptions:
 * - CSS variables: var(--bg-*), var(--text-*)
 * - className with dark: prefix before the light class
 * - test files (*.test.ts, *.test.tsx, *.spec.*)
 * - CSS files (handled separately)
 *
 * Scopes (Phase 05 extended):
 * - apps/web/app/**
 * - packages/auth-ui/src/**
 * - packages/web-guards/src/**
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SCOPES = [
	join(__dirname, '../apps/web/app'),
	join(__dirname, '../packages/auth-ui/src'),
	join(__dirname, '../packages/web-guards/src'),
];

const FORBIDDEN_PATTERNS = [
	// Tailwind light-mode bg without dark: prefix
	/\bbg-white\b(?![^"]*dark:bg-)/,
	/\bbg-gray-(?:50|100|200)\b(?![^"]*dark:)/,
	/\bbg-slate-(?:50|100|200)\b(?![^"]*dark:)/,
	// Tailwind light-mode text
	/\btext-black\b(?![^"]*dark:)/,
	/\btext-gray-(?:700|800|900)\b(?![^"]*dark:)/,
	// Inline style with white/light backgrounds
	/style=\{\{[^}]*background:\s*['"](?:white|#fff|#ffffff|rgb\(255)/i,
	/style=\{\{[^}]*color:\s*['"](?:black|#000|#0{3,6})/i,
];

const SKIP_EXTENSIONS = new Set(['.css', '.scss', '.md', '.json', '.sql', '.mjml']);
const SKIP_PATTERNS = [/\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/, /node_modules/];

function walkDir(dir: string, files: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			walkDir(fullPath, files);
		} else {
			files.push(fullPath);
		}
	}
	return files;
}

let violations = 0;

for (const scope of SCOPES) {
	let files: string[];
	try {
		files = walkDir(scope);
	} catch {
		// Scope dir may not exist yet
		continue;
	}

	for (const file of files) {
		if (SKIP_EXTENSIONS.has(extname(file))) continue;
		if (SKIP_PATTERNS.some((p) => p.test(file))) continue;

		const src = readFileSync(file, 'utf-8');
		const lines = src.split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;
			for (const pattern of FORBIDDEN_PATTERNS) {
				if (pattern.test(line)) {
					console.error(`❌ design-drift: ${file}:${i + 1} — ${line.trim()}`);
					violations++;
				}
			}
		}
	}
}

if (violations > 0) {
	console.error(`\n${violations} design drift violation(s). Use CSS variables or dark: prefix. (ADR-0010, ADR-0030)`);
	process.exit(1);
}

console.log('✓ design-drift: no violations.');
