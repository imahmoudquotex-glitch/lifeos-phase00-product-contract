#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'packages', 'db', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('[check-migrations] No migrations directory found. OK');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
if (files.length === 0) {
  console.log('[check-migrations] No migrations found. OK');
  process.exit(0);
}

const pattern = /^(\d{4})__[a-z0-9_]+\.sql$/;
let lastNum: number | null = null;

for (const file of files.sort()) {
  const match = file.match(pattern);
  if (!match) {
    console.error(`[check-migrations] Invalid migration filename format: ${file}`);
    process.exit(1);
  }
  const num = parseInt(match[1]!, 10);
  if (lastNum !== null && num !== lastNum + 1) {
    console.error(`[check-migrations] Non-contiguous migration sequence. Expected ${lastNum + 1}, found ${num} in ${file}`);
    process.exit(1);
  }
  lastNum = num;
}

console.log('[check-migrations] OK');
