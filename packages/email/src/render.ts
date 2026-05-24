import mjml2html from 'mjml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppError } from '@lifeos/shared';
import { format, isSupported, type SupportedLocale } from './i18n';

const TEMPLATES_DIR = join(__dirname, 'templates');

export type TemplateName = 'welcome' | 'reset-password' | 'magic-link' | 'verify-email';

/**
 * ADR-0028: Renders an email template for a given locale.
 *
 * Process:
 * 1. Read the {templateName}.{locale}.mjml file
 * 2. Extract subject from <!-- subject: ... --> comment (ICU-formatted)
 * 3. Format the MJML source with ICU vars
 * 4. Compile MJML → HTML (strict validation)
 * 5. Return { subject, html }
 */
export function renderEmail(
	templateName: TemplateName,
	locale: string,
	vars: Record<string, string | number>,
): { subject: string; html: string } {
	if (!isSupported(locale)) {
		throw new AppError('LOCALE_NOT_SUPPORTED', `Locale '${locale}' is not supported.`);
	}

	const safeLocale = locale as SupportedLocale;
	const file = join(TEMPLATES_DIR, `${templateName}.${safeLocale}.mjml`);

	let mjmlSource: string;
	try {
		mjmlSource = readFileSync(file, 'utf-8');
	} catch {
		throw new AppError(
			'EMAIL_TEMPLATE_NOT_FOUND',
			`Template '${templateName}.${safeLocale}' not found at ${file}.`,
		);
	}

	// Extract subject from <!-- subject: {template} --> comment
	const subjectMatch = mjmlSource.match(/<!--\s*subject:\s*(.+?)\s*-->/);
	const subjectTemplate = subjectMatch?.[1] ?? templateName;
	const subject = format(subjectTemplate, vars, safeLocale);

	// Format ICU vars into MJML source before compilation
	const renderedMjml = format(mjmlSource, vars, safeLocale);

	const { html, errors } = mjml2html(renderedMjml, { validationLevel: 'strict' });
	if (errors.length > 0) {
		throw new AppError(
			'EMAIL_TEMPLATE_NOT_FOUND',
			`MJML compile errors in '${templateName}.${safeLocale}': ${errors.map((e) => e.message).join(', ')}`,
		);
	}

	return { subject, html };
}
