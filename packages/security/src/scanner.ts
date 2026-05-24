const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
	{ name: 'AWS_ACCESS_KEY', re: /AKIA[0-9A-Z]{16}/g },
	{ name: 'GENERIC_API_KEY', re: /(?:api[_-]?key|apikey)['"\s:=]+[A-Za-z0-9_-]{20,}/gi },
	{ name: 'PRIVATE_KEY_BLOCK', re: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
	{ name: 'JWT_LIKE', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
	{ name: 'STRIPE_LIVE', re: /sk_live_[A-Za-z0-9]{24,}/g },
	{ name: 'GH_PAT', re: /ghp_[A-Za-z0-9]{36,}/g },
];

export function scanTextForSecrets(file: string, text: string): string[] {
	const hits: string[] = [];
	for (const p of SECRET_PATTERNS) {
		const m = text.match(p.re);
		if (m) hits.push(`${file}: ${p.name} (${m.length} match${m.length === 1 ? '' : 'es'})`);
	}
	return hits;
}
