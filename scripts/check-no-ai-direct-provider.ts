#!/usr/bin/env tsx
/**
 * check-no-ai-direct-provider.ts — Phase 01 active guard
 * Fails if any source file outside packages/ai/ imports a known AI SDK directly.
 * AI SDK usage is gated to Phase 06 and must live exclusively in packages/ai/.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const AI_PROVIDERS = ['openai', '@anthropic-ai/sdk', '@google/generative-ai', 'cohere', 'mistral', 'groq-sdk', 'together-ai'];
const IMPORT_RE = new RegExp(`from\\s+['"](?:${AI_PROVIDERS.map((p) => p.replace('/', '/')).join('|')})['"]`);
const failures: string[] = [];

const ALLOWED_DIR = join(ROOT, 'packages', 'ai');

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
		if (full.startsWith(ALLOWED_DIR)) continue;
		if (statSync(full).isDirectory()) {
			scanDir(full);
		} else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
			const content = readFileSync(full, 'utf8');
			if (IMPORT_RE.test(content)) {
				failures.push(`Direct AI SDK import in: ${full}`);
			}
		}
	}
}

scanDir(join(ROOT, 'packages'));
scanDir(join(ROOT, 'apps'));

if (failures.length > 0) {
	console.error('[check-no-ai-direct-provider] FAILED:');
	for (const f of failures) console.error('  ' + f);
	process.exit(1);
}
console.error('[check-no-ai-direct-provider] OK');
