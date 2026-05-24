import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SESSION_PEPPER: z.string().min(32),
  COOKIE_DOMAIN: z.string().default('localhost'),
});

export function getServerEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Invalid server environment variables:', parsed.error.format());
    }
    // Return dummy in test, throw in prod/dev
    if (process.env.NODE_ENV === 'test') {
      return { DATABASE_URL: 'postgres://test', SESSION_PEPPER: '12345678901234567890123456789012', COOKIE_DOMAIN: 'localhost' } as any;
    }
    throw new Error('Invalid server environment variables');
  }
  return parsed.data;
}
