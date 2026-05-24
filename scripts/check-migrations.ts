#!/usr/bin/env tsx
/**
 * check-migrations.ts — PLACEHOLDER (activates Phase 02)
 *
 * Will enforce:
 * - Every file in migrations/ matches /^\d{4}__[a-z0-9_]+\.sql$/
 * - Migration numbers are contiguous within the reserved range for each phase
 * - No migration file uses a number outside its phase's reserved range
 *
 * Phase 01 has no migrations. This guard exits 0 until Phase 02.
 */
console.error('[check-migrations] PLACEHOLDER — activates Phase 02. OK');
