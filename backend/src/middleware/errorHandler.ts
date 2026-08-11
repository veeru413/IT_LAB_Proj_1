import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/response';

/** 404 handler for unmatched routes - runs before the error handler below. */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

interface NormalisedError {
  statusCode: number;
  message: string;
  errors?: unknown;
}

/** Maps any thrown value onto a status code + safe client-facing message. */
const normaliseError = (error: unknown): NormalisedError => {
  if (error instanceof ApiError) {
    return { statusCode: error.statusCode, message: error.message, errors: error.details };
  }

  if (error instanceof ZodError) {
    const errors = error.issues.reduce<Record<string, string>>((acc, issue) => {
      const key = issue.path.join('.') || 'root';
      if (!acc[key]) acc[key] = issue.message;
      return acc;
    }, {});
    return { statusCode: 400, message: 'Validation failed', errors };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | string | undefined) ?? 'field';
        const field = Array.isArray(target) ? target.join(', ') : target;
        return { statusCode: 409, message: `A record with this ${field} already exists` };
      }
      case 'P2025':
        return { statusCode: 404, message: 'Resource not found' };
      case 'P2003':
        return { statusCode: 400, message: 'Related record does not exist' };
      default:
        return { statusCode: 400, message: 'Database request could not be completed' };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { statusCode: 400, message: 'Invalid data supplied to the database layer' };
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return { statusCode: 400, message: 'Malformed JSON in request body' };
  }

  // Anything reaching here is an unexpected bug - never leak its details.
  return { statusCode: 500, message: 'Internal server error' };
};

/**
 * Central error handler. Guarantees the `{ success: false, message }` contract
 * and makes sure stack traces are logged server-side but never sent to the
 * browser.
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const { statusCode, message, errors } = normaliseError(error);

  if (statusCode >= 500 && !env.isTest) {
    console.error('[error]', error);
  }

  sendError(res, statusCode, message, errors);
};
