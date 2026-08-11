import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import type { Role } from '../types/domain';

/**
 * Role gate. Must always be mounted *after* `authenticate`.
 *
 * This is the only place authorisation is decided - the React app hides admin
 * links purely for usability. A student calling an admin endpoint directly
 * still receives 403 Forbidden.
 */
export const requireRole =
  (...allowedRoles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required. Please log in.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to access this resource'),
      );
    }

    return next();
  };

/** Convenience wrapper for the admin-only router. */
export const requireAdmin: RequestHandler = requireRole('ADMIN');
