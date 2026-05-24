import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { Budget } from './expense.types';

type BudgetRow = {
	id: string;
	workspace_id: string;
	category: string;
	monthly_limit_cents: string;
	currency: string;
	created_at: Date;
	updated_at: Date;
};

export class BudgetRepo extends BaseRepo<Budget, BudgetRow> {
	protected readonly table = 'budgets';
	protected readonly columns = [
		'id', 'workspace_id', 'category', 'monthly_limit_cents::text', 'currency', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: BudgetRow): Budget {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			category: r.category,
			monthlyLimitCents: BigInt(r.monthly_limit_cents),
			currency: r.currency,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async upsert(input: {
		workspaceId: string;
		category: string;
		monthlyLimitCents: bigint;
		currency: string;
	}): Promise<Budget> {
		const id = newUlid();
		const row = await this.db.one<BudgetRow>(
			`INSERT INTO budgets (id, workspace_id, category, monthly_limit_cents, currency)
			 VALUES ($1,$2,$3,$4,$5)
			 ON CONFLICT (workspace_id, category) DO UPDATE
			   SET monthly_limit_cents = EXCLUDED.monthly_limit_cents,
			       currency = EXCLUDED.currency,
			       updated_at = now()
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.category, input.monthlyLimitCents, input.currency],
		);
		return this.mapRow(row);
	}
}
