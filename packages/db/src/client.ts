export interface DbClient {
	one<T>(sql: string, params?: unknown[]): Promise<T>;
	oneOrNone<T>(sql: string, params?: unknown[]): Promise<T | null>;
	many<T>(sql: string, params?: unknown[]): Promise<T[]>;
	none(sql: string, params?: unknown[]): Promise<void>;
	tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
}
