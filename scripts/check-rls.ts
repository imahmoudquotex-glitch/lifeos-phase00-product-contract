#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'packages', 'db', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.log('[check-rls] No migrations directory found. OK');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
const allSql = files.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

const createTableMatches = allSql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z0-9_]+)\s*\(([^;]+)\);/gi);
const tablesWithWorkspaceId: string[] = [];

for (const match of createTableMatches) {
  const tableName = match[1]!;
  const tableBody = match[2]!;
  if (tableBody.includes('workspace_id') || tableName === 'workspaces') {
    tablesWithWorkspaceId.push(tableName);
  }
}

let failed = false;
for (const table of tablesWithWorkspaceId) {
  const hasEnableRls = new RegExp(`ALTER TABLE\\s+${table}\\s+ENABLE\\s+ROW LEVEL SECURITY`, 'i').test(allSql);
  const hasPolicy = new RegExp(`CREATE POLICY\\s+.*\\s+ON\\s+${table}`, 'i').test(allSql);
  
  if (!hasEnableRls) {
    console.error(`[check-rls] Table ${table} has workspace_id but missing ENABLE ROW LEVEL SECURITY`);
    failed = true;
  }
  if (!hasPolicy) {
    console.error(`[check-rls] Table ${table} has workspace_id but missing CREATE POLICY`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('[check-rls] OK');
