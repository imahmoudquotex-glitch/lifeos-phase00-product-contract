import type { DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared';

export type XpEvent = {
	id: string;
	workspaceId: string;
	userId: string;
	source: string;
	delta: number;
	metadata: Record<string, unknown>;
	createdAt: Date;
};

export class XpRepo {
	constructor(private readonly db: DbClient) {}

	async award(input: {
		workspaceId: string;
		userId: string;
		source: string;
		delta: number;
		metadata?: Record<string, unknown>;
	}): Promise<XpEvent> {
		const id = newUlid();
		const row = await this.db.one<{
			id: string; workspace_id: string; user_id: string;
			source: string; delta: number; metadata: Record<string, unknown>; created_at: Date;
		}>(
			`INSERT INTO xp_events (id, workspace_id, user_id, source, delta, metadata)
			 VALUES ($1,$2,$3,$4,$5,$6)
			 RETURNING id, workspace_id, user_id, source, delta, metadata, created_at`,
			[id, input.workspaceId, input.userId, input.source, input.delta, JSON.stringify(input.metadata ?? {})],
		);
		return {
			id: row.id,
			workspaceId: row.workspace_id,
			userId: row.user_id,
			source: row.source,
			delta: row.delta,
			metadata: row.metadata,
			createdAt: row.created_at,
		};
	}

	async sumByUser(workspaceId: string, userId: string): Promise<number> {
		const row = await this.db.one<{ total: string }>(
			`SELECT COALESCE(SUM(delta), 0)::text AS total FROM xp_events WHERE workspace_id = $1 AND user_id = $2`,
			[workspaceId, userId],
		);
		return Number(row.total);
	}
}
