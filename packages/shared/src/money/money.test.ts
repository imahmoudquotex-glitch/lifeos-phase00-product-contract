import { describe, expect, it } from 'vitest';
import { money, addMoney } from './money';
import { AppError } from '../errors/app-error';

describe('money()', () => {
	it('creates Money with bigint cents', () => {
		const m = money(100, 'USD');
		expect(m.cents).toBe(100n);
		expect(m.currency).toBe('USD');
	});
	it('accepts bigint input', () => {
		const m = money(100n, 'EUR');
		expect(m.cents).toBe(100n);
	});
	it('uppercases currency', () => {
		const m = money(50, 'usd');
		expect(m.currency).toBe('USD');
	});
	it('truncates fractional cents', () => {
		const m = money(99.9, 'USD');
		expect(m.cents).toBe(99n);
	});
	it('throws on 2-letter currency', () => {
		expect(() => money(100, 'US')).toThrow(AppError);
	});
	it('throws on 4-letter currency', () => {
		expect(() => money(100, 'USDD')).toThrow(AppError);
	});
});

describe('addMoney()', () => {
	it('adds same-currency amounts', () => {
		expect(addMoney(money(100, 'USD'), money(50, 'USD')).cents).toBe(150n);
	});
	it('throws on currency mismatch', () => {
		expect(() => addMoney(money(100, 'USD'), money(50, 'EUR'))).toThrow(AppError);
	});
});
