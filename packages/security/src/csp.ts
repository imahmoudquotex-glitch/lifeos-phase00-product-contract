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

import { newUlid } from '@lifeos/shared/ids';
import type { DbClient } from '@lifeos/db';

export async function insertCspReport(
  dbClient: DbClient,
  report: Record<string, unknown>,
  violatedDirective: string,
  blockedUri: string,
  documentUri: string,
  sourceFile: string | null
): Promise<void> {
  await dbClient.none(
    `INSERT INTO csp_reports (id, violated_directive, blocked_uri, document_uri, source_file, raw_report)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      newUlid(),
      violatedDirective,
      blockedUri,
      documentUri,
      sourceFile,
      JSON.stringify(report),
    ]
  );
}
