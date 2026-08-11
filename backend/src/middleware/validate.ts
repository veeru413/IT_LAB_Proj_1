import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

type RequestPart = 'body' | 'query' | 'params';

/** `{ field: "message" }` - easy for the React forms to consume directly. */
const formatIssues = (error: ZodError): Record<string, string> =>
  error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join('.') || 'root';
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});

/**
 * Validates and *replaces* one part of the request with the parsed result, so
 * controllers receive trimmed, coerced, correctly typed data.
 *
 * Never trust the client: this runs regardless of what the React forms did.
 */
export const validate =
  (schema: ZodTypeAny, part: RequestPart = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', formatIssues(result.error)));
    }

    // `req.query` / `req.params` are getter-only in some Express versions, so
    // the parsed value is stashed on a dedicated property as well.
    if (part === 'body') {
      req.body = result.data;
    } else {
      Object.defineProperty(req, part === 'query' ? 'validatedQuery' : 'validatedParams', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      try {
        Object.assign(req[part] as Record<string, unknown>, result.data);
      } catch {
        /* read-only in this Express version - the validated copy above is used */
      }
    }

    return next();
  };

/** Reads the object produced by `validate(schema, 'query')`. */
export const getValidatedQuery = <T>(req: Request): T =>
  ((req as unknown as { validatedQuery?: T }).validatedQuery ?? (req.query as unknown as T));

/** Reads the object produced by `validate(schema, 'params')`. */
export const getValidatedParams = <T>(req: Request): T =>
  ((req as unknown as { validatedParams?: T }).validatedParams ?? (req.params as unknown as T));
