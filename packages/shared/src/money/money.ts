import { AppError } from '../errors/app-error';

export interface Money {
	cents: bigint;
	currency: string;
}

export function money(cents: number | bigint, currency: string): Money {
	if (currency.length !== 3)
		throw new AppError('MONEY_INVALID_CURRENCY', 'currency must be ISO-4217 3 letters');
	const c = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(cents));
	return { cents: c, currency: currency.toUpperCase() };
}

export function addMoney(a: Money, b: Money): Money {
	if (a.currency !== b.currency)
		throw new AppError('MONEY_CURRENCY_MISMATCH', 'cannot add different currencies');
	return { cents: a.cents + b.cents, currency: a.currency };
}
