import { AppError } from '../errors/app-error';

export interface ServerEnv {
	NODE_ENV: 'development' | 'test' | 'production';
	DATABASE_URL: string;
}

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
	if (cached) return cached;
	const NODE_ENV = (process.env['NODE_ENV'] ?? 'development') as ServerEnv['NODE_ENV'];
	const DATABASE_URL = process.env['DATABASE_URL'];
	if (!DATABASE_URL) throw new AppError('ENV_MISSING', 'DATABASE_URL is required');
	cached = { NODE_ENV, DATABASE_URL };
	return cached;
}

/** Test-only: clears the cached env so the next getServerEnv() re-reads process.env. */
export function resetServerEnvCache(): void {
	cached = null;
}
