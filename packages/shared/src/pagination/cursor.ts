export interface Cursor {
	before?: string;
	after?: string;
	limit: number;
}

export function defaultCursor(limit = 50): Cursor {
	return { limit: Math.min(Math.max(limit, 1), 200) };
}

export function encodeCursor(c: Cursor): string {
	return Buffer.from(JSON.stringify(c)).toString('base64url');
}

export function decodeCursor(s: string): Cursor {
	return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Cursor;
}
