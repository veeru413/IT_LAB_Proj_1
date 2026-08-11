import type { AuthenticatedUser } from './domain';

/**
 * Augments Express' `Request` so that `req.user` is strongly typed everywhere
 * downstream of the `authenticate` middleware.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
