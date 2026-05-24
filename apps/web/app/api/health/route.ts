import { envelopeOk } from '@lifeos/shared';

export const dynamic = 'force-dynamic';

export function GET(): Response {
	return Response.json(envelopeOk({ status: 'ok', phase: '01' }));
}
