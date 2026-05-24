import { type NextRequest, NextResponse } from 'next/server';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { newUlid } from '@lifeos/shared/ids';
import { consoleLogger as logger } from '@lifeos/shared';

/**
 * CSP violation reporting endpoint.
 * Browsers POST here when a Content-Security-Policy violation occurs.
 * Reports are written to the csp_reports table (migration 0151).
 *
 * Responds 204 regardless of parsing errors to avoid error loops.
 * Rate limiting is handled by the CDN/load balancer upstream.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let report: Record<string, unknown> = {};

  try {
    report = (await req.json()) as Record<string, unknown>;
  } catch {
    // Invalid JSON — log and return early; still 204 to prevent browser retry storms
    logger.warn('csp_violation_parse_error', { url: req.url });
    return new NextResponse(null, { status: 204 });
  }

  // Extract the CSP report wrapper (browsers send { "csp-report": { ... } })
  const inner =
    (report['csp-report'] as Record<string, unknown> | undefined) ?? report;

  const violatedDirective = (inner['violated-directive'] as string | undefined) ?? 'unknown';
  const blockedUri = (inner['blocked-uri'] as string | undefined) ?? '';
  const documentUri = (inner['document-uri'] as string | undefined) ?? '';
  const sourceFile = (inner['source-file'] as string | undefined) ?? null;

  logger.warn('csp_violation', { violatedDirective, blockedUri, documentUri });

  try {
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const { insertCspReport } = await import('@lifeos/security');
    await insertCspReport(dbClient, report, violatedDirective, blockedUri, documentUri, sourceFile);
  } catch (err: unknown) {
    // Never let a DB error propagate — CSP reporting must not cause browser errors
    logger.error('csp_report_db_error', { err });
  }

  return new NextResponse(null, { status: 204 });
}
