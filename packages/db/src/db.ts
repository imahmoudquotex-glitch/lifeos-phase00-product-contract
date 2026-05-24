import { getDb } from './postgres-adapter';

// In a real app we'd inject this cleanly, but for simplicity in this Next.js app:
export const db = getDb(process.env.DATABASE_URL || 'postgresql://lifeos:lifeos@localhost:5432/lifeos_dev');
