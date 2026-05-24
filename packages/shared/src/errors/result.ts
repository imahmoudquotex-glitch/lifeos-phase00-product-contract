import { AppError } from './app-error';

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (error: AppError): Err => ({ ok: false, error });
export const isOk = <T>(r: Result<T>): r is Ok<T> => r.ok === true;
export const isErr = <T>(r: Result<T>): r is Err => r.ok === false;
