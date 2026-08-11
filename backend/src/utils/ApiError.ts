/**
 * Application-level error carrying the HTTP status code it should produce.
 *
 * Throwing `ApiError` anywhere in the service or repository layer lets the
 * central error handler translate it into a consistent JSON response without
 * every controller needing its own try/catch.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  /** Distinguishes deliberate, expected failures from genuine bugs. */
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}
