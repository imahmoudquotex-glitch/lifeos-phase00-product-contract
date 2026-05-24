import type { DbClient } from '@lifeos/db';

export abstract class BaseRepo<TEntity, TRow = TEntity> {
	protected abstract readonly table: string;
	protected abstract readonly columns: readonly string[];
	/**
	 * Set to false in subclasses for append-only or non-soft-delete tables
	 * (note_versions, habit_checkins, xp_events, daily_reviews, webhook_nonces).
	 */
	protected readonly hasSoftDelete: boolean = true;
	protected abstract mapRow(row: TRow): TEntity;

	constructor(protected readonly db: DbClient) {}

	protected selectList(): string {
		if (this.columns.length === 0) {
			throw new Error(`REPO_EMPTY_COLUMNS: ${this.table}`);
		}
		if (this.columns.some((c) => c === '*' || c.includes('*'))) {
			throw new Error(`REPO_WILDCARD_FORBIDDEN: ${this.table}`);
		}
		return this.columns.join(', ');
	}

	protected deletedFilter(): string {
		return this.hasSoftDelete ? 'AND is_deleted = false' : '';
	}

	async findById(id: string, workspaceId: string): Promise<TEntity | null> {
		const row = await this.db.oneOrNone<TRow>(
			`SELECT ${this.selectList()} FROM ${this.table} WHERE id = $1 AND workspace_id = $2 ${this.deletedFilter()}`,
			[id, workspaceId],
		);
		return row ? this.mapRow(row) : null;
	}

	async listByWorkspace(
		workspaceId: string,
		opts: { limit?: number; cursor?: string | null } = {},
	): Promise<{ items: TEntity[]; nextCursor: string | null }> {
		const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
		const rows = await this.db.any<TRow>(
			`SELECT ${this.selectList()} FROM ${this.table}
			  WHERE workspace_id = $1 ${this.deletedFilter()}
			    AND ($2::text IS NULL OR id > $2)
			  ORDER BY id ASC LIMIT $3`,
			[workspaceId, opts.cursor ?? null, limit + 1],
		);
		const items = rows.slice(0, limit).map((r) => this.mapRow(r));
		const nextCursor = rows.length > limit ? (rows[limit - 1] as unknown as { id: string }).id : null;
		return { items, nextCursor };
	}
}

