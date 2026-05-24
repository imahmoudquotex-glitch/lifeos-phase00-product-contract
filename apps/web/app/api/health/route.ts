// @ts-nocheck
import { envelopeOk } from '@lifeos/shared';
import { withApiErrorHandling } from '@lifeos/route';

export const dynamic = 'force-dynamic';

export const GET = withApiErrorHandling(async (_req: Request) => {
	return Response.json(envelopeOk({ status: 'ok', phase: '01' }));
});
