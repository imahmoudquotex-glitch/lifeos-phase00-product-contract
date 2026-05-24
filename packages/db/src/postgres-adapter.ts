import postgres, { type Sql, type TransactionSql } from 'postgres';
import { AppError } from '@lifeos/shared/errors';
import type { DbClient } from './client';

type AnySql = Sql<Record<string, never>> | TransactionSql<Record<string, never>>;

function wrapExecutor(sql: AnySql): Omit<DbClient, 'tx'> {
	return {
		// Note: We use sql.unsafe() because DbClient accepts raw strings + parameter arrays.
		// This is safe because parameters are passed separately to the driver, preventing injection.
		async one<T>(query: string, params?: unknown[]): Promise<T> {
			const rows = await sql.unsafe<T[]>(query, (params ?? []) as never);
			if (rows.length !== 1)
				throw new AppError('DB_EXPECTED_ONE', `expected 1 row, got ${rows.length}`);
			return rows[0] as T;
		},
		async oneOrNone<T>(query: string, params?: unknown[]): Promise<T | null> {
			const rows = await sql.unsafe<T[]>(query, (params ?? []) as never);
			if (rows.length > 1)
				throw new AppError(
					'DB_EXPECTED_ONE_OR_NONE',
					`expected <=1 row, got ${rows.length}`,
				);
			return (rows[0] as T) ?? null;
		},
		async many<T>(query: string, params?: unknown[]): Promise<T[]> {
			return (await sql.unsafe<T[]>(query, (params ?? []) as never)) as T[];
		},
		async none(query: string, params?: unknown[]): Promise<void> {
			await sql.unsafe(query, (params ?? []) as never);
		},
	};
}

function wrap(sql: Sql<Record<string, never>>): DbClient {
	const exec = wrapExecutor(sql);
	return {
		...exec,
		async tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
			return sql.begin((s: TransactionSql<Record<string, never>>) => {
				const txExec = wrapExecutor(s);
				const txClient: DbClient = {
					...txExec,
					tx: <U>(innerFn: (tx: DbClient) => Promise<U>) =>
						(s as unknown as { begin: (fn: (ts: TransactionSql<Record<string, never>>) => Promise<U>) => Promise<U> }).begin((ts) => {
							const inner = wrapExecutor(ts);
							return innerFn({ ...inner, tx: () => { throw new AppError('DB_TRANSIENT', 'nested transactions not supported'); } });
						}),
				};
				return fn(txClient);
			}) as Promise<T>;
		},
	};
}

let client: DbClient | null = null;

export function getDb(databaseUrl: string): DbClient {
	if (client) return client;
	const sql = postgres(databaseUrl, { max: 10, prepare: false });
	client = wrap(sql);
	return client;
}
