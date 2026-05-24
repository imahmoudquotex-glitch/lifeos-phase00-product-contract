export type CursorPage<T> = {
	items: T[];
	nextCursor: string | null;
};

export function buildCursorPage<T extends { id: string }>(rows: T[], limit: number): CursorPage<T> {
	const items = rows.slice(0, limit);
	const nextCursor = rows.length > limit ? (rows[limit - 1]?.id ?? null) : null;
	return { items, nextCursor };
}
