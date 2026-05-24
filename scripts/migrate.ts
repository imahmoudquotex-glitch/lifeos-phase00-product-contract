import fs from 'fs';
import path from 'path';
import { db } from '@lifeos/db';

async function migrate() {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    
    const migrationsDir = path.join(process.cwd(), 'packages/db/migrations');
    if (!fs.existsSync(migrationsDir)) return;
    
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    for (const file of files) {
      const { rows } = await client.query('SELECT id FROM migrations WHERE name = $1', [file]);
      if (rows.length === 0) {
        console.log(`Applying ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Migration failed: ${file}`, err);
          process.exit(1);
        }
      }
    }
    console.log('All migrations applied.');
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
