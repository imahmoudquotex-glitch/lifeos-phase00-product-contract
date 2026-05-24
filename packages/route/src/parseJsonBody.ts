import { AppError } from '@lifeos/shared';
import { z } from 'zod';

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Throws VALIDATION_FAILED on parse error.
 */
export async function parseJsonBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
	let raw: unknown;
	try {
		raw = await req.json();
	} catch {
		throw new AppError('VALIDATION_FAILED', 'Request body must be valid JSON');
	}
	const result = schema.safeParse(raw);
	if (!result.success) {
		const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
		throw new AppError('VALIDATION_FAILED', issues.join('; '), { issues });
	}
	return result.data;
}
