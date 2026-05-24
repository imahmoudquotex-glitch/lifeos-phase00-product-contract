import { BaseRepo } from '@lifeos/repo';
import { AppError, newUlid } from '@lifeos/shared';
import type { Expense } from './expense.types';

type ExpenseRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	amount_cents: string; // bigint comes as string from postgres
	currency: string;
	category: string;
	description: string | null;
	spent_at: string;
	created_at: Date;
	updated_at: Date;
};

export class ExpenseRepo extends BaseRepo<Expense, ExpenseRow> {
	protected readonly table = 'expenses';
	protected readonly columns = [
		'id', 'workspace_id', 'created_by', 'amount_cents::text', 'currency',
		'category', 'description', 'spent_at::text', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: ExpenseRow): Expense {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			amountCents: BigInt(r.amount_cents),
			currency: r.currency,
			category: r.category,
			description: r.description,
			spentAt: r.spent_at,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async createWithBudgetCheck(input: {
		workspaceId: string;
		createdBy: string;
		amountCents: bigint;
		currency: string;
		category: string;
		description?: string;
		spentAt: string;
	}): Promise<Expense> {
		return this.db.tx(async (tx) => {
			// 1) Lock the budget row FOR UPDATE (race-free, ADR 0017)
			const budget = await tx.oneOrNone<{ monthly_limit_cents: string }>(
				`SELECT monthly_limit_cents::text
				  FROM budgets
				  WHERE workspace_id = $1 AND category = $2 AND currency = $3
				  FOR UPDATE`,
				[input.workspaceId, input.category, input.currency],
			);
			if (budget) {
				// 2) SUM existing expenses for the calendar month
				const monthStart = `${input.spentAt.slice(0, 7)}-01`;
				const sumRow = await tx.one<{ s: string }>(
					`SELECT COALESCE(SUM(amount_cents), 0)::text AS s
					  FROM expenses
					  WHERE workspace_id = $1 AND category = $2 AND is_deleted = false
					    AND spent_at >= $3::date
					    AND spent_at < ($3::date + INTERVAL '1 month')`,
					[input.workspaceId, input.category, monthStart],
				);
				const monthTotal = BigInt(sumRow.s);
				const limit = BigInt(budget.monthly_limit_cents);
				if (monthTotal + input.amountCents > limit) {
					throw new AppError(
						'BUDGET_EXCEEDED',
						`Adding this expense would exceed the monthly budget for category '${input.category}'.`,
						{ category: input.category, currentTotalCents: monthTotal.toString(), limitCents: limit.toString() },
					);
				}
			}
			// 3) INSERT under the SAME transaction
			const id = newUlid();
			const row = await tx.one<ExpenseRow>(
				`INSERT INTO expenses (id, workspace_id, created_by, amount_cents, currency, category, description, spent_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date)
				 RETURNING ${this.selectList()}`,
				[id, input.workspaceId, input.createdBy, input.amountCents,
				input.currency, input.category, input.description ?? null, input.spentAt],
			);
			return this.mapRow(row);
		});
	}
}
