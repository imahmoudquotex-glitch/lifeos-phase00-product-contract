export type CalendarEvent = {
	id: string;
	workspaceId: string;
	createdBy: string;
	title: string;
	startsAt: Date;
	endsAt: Date;
	allDay: boolean;
	location: string | null;
	notes: string | null;
	timezone: string;
	createdAt: Date;
	updatedAt: Date;
};
