export type HabitCadence = 'daily' | 'weekly' | 'monthly';

export type Habit = {
	id: string;
	workspaceId: string;
	createdBy: string;
	title: string;
	cadence: HabitCadence;
	targetPerPeriod: number;
	createdAt: Date;
	updatedAt: Date;
};

export type HabitCheckin = {
	id: string;
	habitId: string;
	workspaceId: string;
	userId: string;
	checkinDate: string;
	note: string | null;
	createdAt: Date;
};
