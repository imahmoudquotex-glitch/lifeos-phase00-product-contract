import { describe, it, expect } from 'vitest';
import { renderEmail } from '../../packages/email/src/render';

// Note: renderEmail reads MJML files from disk.
// These tests verify the render pipeline end-to-end.
// They require the templates/ directory to be present relative to the test runner.
// If running from monorepo root, templates are at packages/email/src/templates/

describe('renderEmail — welcome', () => {
	it('renders welcome.en with correct subject and HTML', () => {
		const { subject, html } = renderEmail('welcome', 'en', {
			name: 'Ahmed',
			email: 'ahmed@example.com',
			ctaUrl: 'https://lifeos.app/app',
		});
		expect(subject).toBe('Welcome to LifeOS, Ahmed');
		expect(html).toContain('Ahmed');
		expect(html).toContain('https://lifeos.app/app');
		expect(html).toContain('LifeOS');
	});

	it('renders welcome.ar with Arabic subject', () => {
		const { subject, html } = renderEmail('welcome', 'ar', {
			name: 'أحمد',
			email: 'ahmed@example.com',
			ctaUrl: 'https://lifeos.app/app',
		});
		expect(subject).toContain('أحمد');
		expect(html).toContain('أحمد');
	});
});

describe('renderEmail — reset-password', () => {
	it('renders reset-password.en with reset URL', () => {
		const { subject, html } = renderEmail('reset-password', 'en', {
			resetUrl: 'https://lifeos.app/reset?token=abc123',
			email: 'user@example.com',
		});
		expect(subject).toContain('Reset');
		expect(html).toContain('abc123');
	});
});

describe('renderEmail — error handling', () => {
	it('throws LOCALE_NOT_SUPPORTED for unknown locale', () => {
		expect(() => renderEmail('welcome', 'fr', { name: 'x', email: 'x@x.com', ctaUrl: '/' }))
			.toThrow(expect.objectContaining({ code: 'LOCALE_NOT_SUPPORTED' }));
	});

	it('throws EMAIL_TEMPLATE_NOT_FOUND for unknown template', () => {
		expect(() => renderEmail('nonexistent' as never, 'en', {}))
			.toThrow(expect.objectContaining({ code: 'EMAIL_TEMPLATE_NOT_FOUND' }));
	});
});
