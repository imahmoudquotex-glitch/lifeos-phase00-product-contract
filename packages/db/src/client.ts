/**
 * DbClient — Phase 01 contract (closed, do not add methods without ADR).
 * one        → expects exactly 1 row, throws DB_EXPECTED_ONE otherwise.
 * oneOrNone  → 0 or 1 row, throws if > 1.
 * many       → 0..N rows.
 * none       → asserts no rows returned (DDL / fire-and-forget DML).
 * tx         → wraps callback in a transaction; inner calls use the same tx client.
 */
export interface DbClient {
	one<T>(sql: string, params?: unknown[]): Promise<T>;
	oneOrNone<T>(sql: string, params?: unknown[]): Promise<T | null>;
	many<T>(sql: string, params?: unknown[]): Promise<T[]>;
	none(sql: string, params?: unknown[]): Promise<void>;
	tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
}
