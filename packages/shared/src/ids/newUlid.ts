/**
 * App-generated ULID. Crockford base32, 26 chars.
 * Uses Web Crypto via globalThis.crypto.getRandomValues — present in Node >= 20 and all modern browsers.
 */
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function randomBytes(n: number): Uint8Array {
	const buf = new Uint8Array(n);
	globalThis.crypto.getRandomValues(buf);
	return buf;
}

function encodeTime(now: number): string {
	let out = '';
	for (let i = TIME_LEN - 1; i >= 0; i--) {
		const mod = now % ENCODING_LEN;
		out = ENCODING[mod]! + out;
		now = (now - mod) / ENCODING_LEN;
	}
	return out;
}

function encodeRandom(): string {
	const buf = randomBytes(RANDOM_LEN);
	let out = '';
	for (let i = 0; i < RANDOM_LEN; i++) {
		out += ENCODING[buf[i]! % ENCODING_LEN]!;
	}
	return out;
}

export function newUlid(now: number = Date.now()): string {
	return encodeTime(now) + encodeRandom();
}
