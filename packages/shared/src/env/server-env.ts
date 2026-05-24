import { z } from 'zod';
import { AppError } from '../errors/app-error';

/**
 * Phase 02 server environment contract.
 * All variables required by Phase 02 Step 21.5 are present.
 * Throws AppError('ENV_MISSING') on misconfiguration (never a raw Error).
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SESSION_PEPPER: z.string().min(32),
  COOKIE_DOMAIN: z.string().default('localhost'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SESSION_COOKIE_NAME: z.string().min(1).default('lifeos_sid'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
});

export type ServerEnv = z.infer<typeof schema>;

let _cache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_cache) return _cache;

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors).join(', ');
    throw new AppError('ENV_MISSING', `Missing or invalid server env vars: ${missing}`);
  }
  _cache = parsed.data;
  return _cache;
}

/**
 * Reset the cached env — for use in tests only.
 * Call before each test that overrides process.env.
 */
export function resetServerEnvCache(): void {
  _cache = null;
}
