import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { extractBearerToken, verifyAccessToken } from '../utils/jwt';
import type { Role } from '../types/domain';

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the current
 * user to `req.user`.
 *
 * The user is re-read from the database on every request rather than trusted
 * straight from the token, so a deleted account or a role change takes effect
 * immediately instead of when the token happens to expire.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw ApiError.unauthorized('Authentication required. Please log in.');
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, studentId: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Account no longer exists. Please log in again.');
    }

    req.user = { ...user, role: user.role as Role };
    next();
  } catch (error) {
    next(error);
  }
};
