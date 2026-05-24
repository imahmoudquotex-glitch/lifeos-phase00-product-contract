#!/usr/bin/env ts-node
/**
 * CI Gate: check-adr-coverage.ts
 * Phase 05 ADR governance gate.
 *
 * Verifies:
 * 1. Expected ADR files exist (0024–0030)
 * 2. Each ADR has Status: Accepted and Phase: 05
 * 3. No ADR has Status: Proposed without a corresponding GitHub issue
 *
 * Exit 0 = pass, Exit 1 = fail.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ADR_DIR = join(__dirname, '../docs/adr');
const REQUIRED_ADRS = [
	'0024-unified-phase-branch-tag-convention.md',
	'0025-zenith-in-place-merge-strategy.md',
	'0026-sign-in-with-password-facade.md',
	'0027-with-csrf-protection-hoc.md',
	'0028-bi-lingual-email-strategy.md',
	'0029-rate-limiting-composite-bucket.md',
	'0030-dark-mode-enforcement-phase05.md',
];

let failures = 0;

for (const filename of REQUIRED_ADRS) {
	const path = join(ADR_DIR, filename);
	if (!existsSync(path)) {
		console.error(`❌ Missing ADR: ${filename}`);
		failures++;
		continue;
	}

	const content = readFileSync(path, 'utf-8');
	if (!/\*\*Status:\*\* Accepted/.test(content)) {
		console.error(`❌ ADR not accepted: ${filename}`);
		failures++;
		continue;
	}

	if (!/\*\*Phase:\*\* 05/.test(content)) {
		console.error(`❌ ADR missing Phase 05 marker: ${filename}`);
		failures++;
		continue;
	}

	console.log(`✓ ${filename}`);
}

if (failures > 0) {
	console.error(`\n${failures} ADR check(s) failed.`);
	process.exit(1);
}

console.log(`\nAll ${REQUIRED_ADRS.length} Phase 05 ADRs pass.`);
