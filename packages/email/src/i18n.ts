import IntlMessageFormat from 'intl-messageformat';

/**
 * ADR-0028: ICU MessageFormat + per-template MJML locale strategy.
 * Supported locales are finite and explicitly listed — no auto-discovery.
 */
export type SupportedLocale = 'ar' | 'en';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['ar', 'en'];

export function isSupported(loc: string): loc is SupportedLocale {
	return (SUPPORTED_LOCALES as string[]).includes(loc);
}

/**
 * Format an ICU message template with values.
 * Used to inject variables into MJML source before compilation.
 */
export function format(
	messageTemplate: string,
	values: Record<string, string | number>,
	locale: SupportedLocale,
): string {
	return new IntlMessageFormat(messageTemplate, locale).format(values) as string;
}
