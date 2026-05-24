import { AppError, newUlid } from '@lifeos/shared';
import { assertCapability, actorUserId, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { AiQuotaRepo } from './ai-quota.repo';
import type { AiUsageEvent } from './ai.types';

export class AiQuotaService {
	private readonly repo: AiQuotaRepo;

	constructor(db: DbClient) {
		this.repo = new AiQuotaRepo(db);
	}

	async reserve(actor: Actor, input: {
		idempotencyKey: string;
		tokens: bigint;
	}): Promise<AiUsageEvent> {
		assertCapability(actor, 'ai:use');
		const eventId = newUlid();
		try {
			return await this.repo.reserve(eventId, actor.workspaceId, actorUserId(actor), input.idempotencyKey, input.tokens);
		} catch (e) {
			const code = this.pgCode(e);
			if (code === 'P0002') throw new AppError('AI_QUOTA_EXCEEDED', 'Monthly AI quota exceeded.');
			if (code === 'P0005') throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found.');
			throw e;
		}
	}

	async complete(actor: Actor, eventId: string, tokensUsed: bigint): Promise<AiUsageEvent> {
		assertCapability(actor, 'ai:use');
		try {
			return await this.repo.complete(eventId, tokensUsed);
		} catch (e) {
			if (this.pgCode(e) === 'P0003') throw new AppError('AI_USAGE_NOT_RESERVED', 'AI usage event not in reserved state.');
			throw e;
		}
	}

	async refund(actor: Actor, eventId: string): Promise<AiUsageEvent> {
		assertCapability(actor, 'ai:use');
		try {
			return await this.repo.refund(eventId);
		} catch (e) {
			if (this.pgCode(e) === 'P0004') throw new AppError('AI_USAGE_NOT_REFUNDABLE', 'AI usage event cannot be refunded.');
			throw e;
		}
	}

	private pgCode(e: unknown): string | undefined {
		return typeof e === 'object' && e !== null && 'code' in e
			? (e as { code: string }).code
			: undefined;
	}
}
