export interface Cursor {
	before?: string;
	after?: string;
	limit: number;
}

export function defaultCursor(limit = 50): Cursor {
	return { limit: Math.min(Math.max(limit, 1), 200) };
}

export function encodeCursor(c: Cursor): string {
	return btoa(JSON.stringify(c)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeCursor(s: string): Cursor {
	const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
	const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
	return JSON.parse(atob(b64 + pad)) as Cursor;
}
