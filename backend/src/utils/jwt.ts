import jwt, { type JwtPayload as StandardJwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';
import { ROLES, type JwtPayload, type Role } from '../types/domain';

/** Signs a short-lived access token for the given user. */
export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'student-task-manager',
  } as SignOptions);

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

/**
 * Verifies a token's signature and expiry and returns its payload.
 * Throws a 401 `ApiError` for anything malformed, tampered with or expired.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  let decoded: string | StandardJwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'student-task-manager' });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token');
  }

  if (typeof decoded === 'string' || !decoded.sub || !isRole(decoded.role)) {
    throw ApiError.unauthorized('Invalid authentication token');
  }

  return {
    sub: decoded.sub,
    email: String(decoded.email ?? ''),
    role: decoded.role,
  };
};

/** Extracts the raw token from an `Authorization: Bearer <token>` header. */
export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim() || null;
};
