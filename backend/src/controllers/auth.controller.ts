import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

/**
 * Controllers stay thin: they read the (already validated) request, delegate to
 * a service and shape the HTTP response. No business logic lives here.
 */

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  return sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  return sendSuccess(res, result, 200);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getProfile(req.user.id);
  return sendSuccess(res, { user });
});

/**
 * With stateless JWTs the server holds no session to destroy, so logout is
 * acknowledged here and the client discards its stored token. The endpoint
 * exists so the flow is explicit and a token blocklist could be added later.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, { message: 'Logged out successfully' }),
);
