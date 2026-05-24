export type AiUsageStatus = 'reserved' | 'completed' | 'refunded';

export type AiUsageEvent = {
	id: string;
	workspaceId: string;
	userId: string;
	idempotencyKey: string;
	tokensReserved: bigint;
	tokensUsed: bigint | null;
	status: AiUsageStatus;
	model: string | null;
	createdAt: Date;
	completedAt: Date | null;
};
