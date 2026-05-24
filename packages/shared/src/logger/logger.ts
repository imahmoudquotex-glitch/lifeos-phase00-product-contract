export interface Logger {
	info(event: string, fields?: Record<string, unknown>): void;
	warn(event: string, fields?: Record<string, unknown>): void;
	error(event: string, fields?: Record<string, unknown>): void;
}

function line(level: 'info' | 'warn' | 'error', event: string, fields?: Record<string, unknown>) {
	const payload = { level, event, ts: new Date().toISOString(), ...(fields ?? {}) };
	console[level](JSON.stringify(payload));
}

export const consoleLogger: Logger = {
	info: (e, f) => line('info', e, f),
	warn: (e, f) => line('warn', e, f),
	error: (e, f) => line('error', e, f),
};
