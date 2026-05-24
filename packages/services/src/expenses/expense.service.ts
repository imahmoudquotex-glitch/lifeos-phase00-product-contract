import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { ExpenseRepo } from './expense.repo';
import { BudgetRepo } from './budget.repo';
import type { Expense, Budget } from './expense.types';

export class ExpenseService {
	private readonly expenses: ExpenseRepo;
	private readonly budgets: BudgetRepo;

	constructor(db: DbClient) {
		this.expenses = new ExpenseRepo(db);
		this.budgets = new BudgetRepo(db);
	}

	async create(actor: Actor, input: {
		amountCents: bigint;
		currency: string;
		category: string;
		description?: string;
		spentAt: string;
	}): Promise<Expense> {
		assertCapability(actor, 'expense:create');
		if (input.amountCents < 0n) {
			throw new AppError('EXPENSE_AMOUNT_INVALID', 'Amount must be non-negative.');
		}
		return this.expenses.createWithBudgetCheck({
			workspaceId: actor.workspaceId,
			createdBy: actor.userId,
			...input,
		});
	}

	async setBudget(actor: Actor, input: {
		category: string;
		monthlyLimitCents: bigint;
		currency: string;
	}): Promise<Budget> {
		assertCapability(actor, 'budget:set');
		return this.budgets.upsert({
			workspaceId: actor.workspaceId,
			...input,
		});
	}

	async getById(actor: Actor, id: string): Promise<Expense> {
		assertCapability(actor, 'expense:update');
		const expense = await this.expenses.findById(id, actor.workspaceId);
		if (!expense) throw new AppError('EXPENSE_NOT_FOUND', 'Expense not found.');
		return expense;
	}
}
