import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SESSION_PEPPER: z.string().min(32),
  COOKIE_DOMAIN: z.string().default('localhost'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid server environment variables:', parsed.error.format());
  throw new Error('Invalid server environment variables');
}

export const serverEnv = parsed.data;
