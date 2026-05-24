/**
 * Exponential backoff with jitter.
 * injectable `random` for deterministic testing.
 */
export function backoffMs(attempt: number, random: () => number = Math.random): number {
	const base = Math.min(60_000, 2 ** attempt * 1000);
	const jitter = Math.floor(random() * 500);
	return base + jitter;
}
