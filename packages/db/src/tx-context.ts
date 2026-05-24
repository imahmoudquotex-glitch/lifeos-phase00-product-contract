import type { DbClient } from './client';

export interface WorkspaceCtx {
	userId: string;
	workspaceId: string;
}

/**
 * Sets per-transaction GUCs so RLS policies can read them via current_setting().
 * The third argument `true` to set_config = transaction-scoped (NOT session-scoped). CRITICAL.
 */
export async function withWorkspaceContext<T>(
	db: DbClient,
	ctx: WorkspaceCtx,
	fn: (tx: DbClient) => Promise<T>,
): Promise<T> {
	return db.tx(async (tx) => {
		await tx.none("select set_config('app.current_user_id', $1, true)", [ctx.userId]);
		await tx.none("select set_config('app.current_workspace_id', $1, true)", [
			ctx.workspaceId,
		]);
		return fn(tx);
	});
}
