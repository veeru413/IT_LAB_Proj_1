import type { Response } from 'express';

/** Shape returned by every successful endpoint. */
export interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Shape returned by every failing endpoint. */
export interface ErrorBody {
  success: false;
  message: string;
  errors?: unknown;
}

/**
 * Sends `{ success: true, data, meta? }`.
 * Keeping this in one place guarantees a uniform contract for the client.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response<SuccessBody<T>> => {
  const body: SuccessBody<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

/** Sends `{ success: false, message, errors? }`. */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
): Response<ErrorBody> => {
  const body: ErrorBody = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
};
