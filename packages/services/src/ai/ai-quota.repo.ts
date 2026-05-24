import type { DbClient } from '@lifeos/db';
import type { AiUsageEvent } from './ai.types';

type AiUsageRow = {
	id: string;
	workspace_id: string;
	user_id: string;
	idempotency_key: string;
	tokens_reserved: string;
	tokens_used: string | null;
	status: string;
	model: string | null;
	created_at: Date;
	completed_at: Date | null;
};

function mapRow(r: AiUsageRow): AiUsageEvent {
	return {
		id: r.id,
		workspaceId: r.workspace_id,
		userId: r.user_id,
		idempotencyKey: r.idempotency_key,
		tokensReserved: BigInt(r.tokens_reserved),
		tokensUsed: r.tokens_used !== null ? BigInt(r.tokens_used) : null,
		status: r.status as AiUsageEvent['status'],
		model: r.model,
		createdAt: r.created_at,
		completedAt: r.completed_at,
	};
}

export class AiQuotaRepo {
	constructor(private readonly db: DbClient) {}

	async reserve(
		eventId: string,
		workspaceId: string,
		userId: string,
		idempotencyKey: string,
		tokens: bigint,
	): Promise<AiUsageEvent> {
		const row = await this.db.one<AiUsageRow>(
			`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`,
			[eventId, workspaceId, userId, idempotencyKey, tokens],
		);
		return mapRow(row);
	}

	async complete(eventId: string, tokensUsed: bigint): Promise<AiUsageEvent> {
		const row = await this.db.one<AiUsageRow>(
			`SELECT * FROM complete_ai_usage($1,$2)`,
			[eventId, tokensUsed],
		);
		return mapRow(row);
	}

	async refund(eventId: string): Promise<AiUsageEvent> {
		const row = await this.db.one<AiUsageRow>(
			`SELECT * FROM refund_ai_usage($1)`,
			[eventId],
		);
		return mapRow(row);
	}
}
