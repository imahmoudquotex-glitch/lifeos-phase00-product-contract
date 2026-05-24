export type Expense = {
	id: string;
	workspaceId: string;
	createdBy: string;
	amountCents: bigint;
	currency: string;
	category: string;
	description: string | null;
	spentAt: string;
	createdAt: Date;
	updatedAt: Date;
};

export type Budget = {
	id: string;
	workspaceId: string;
	category: string;
	monthlyLimitCents: bigint;
	currency: string;
	createdAt: Date;
	updatedAt: Date;
};
