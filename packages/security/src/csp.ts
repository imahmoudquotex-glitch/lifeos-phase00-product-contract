export function buildCspHeader(nonce: string, reportUri: string): string {
	return [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		`style-src 'self' 'nonce-${nonce}'`,
		`img-src 'self' data: blob:`,
		`font-src 'self'`,
		`connect-src 'self'`,
		`frame-ancestors 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`object-src 'none'`,
		`upgrade-insecure-requests`,
		`report-uri ${reportUri}`,
	].join('; ');
}
