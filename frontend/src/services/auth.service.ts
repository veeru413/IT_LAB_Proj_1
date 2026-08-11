import { api } from './api';
import type { User } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  studentId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

/**
 * Tells the server the session has ended. JWTs are stateless, so the
 * authoritative step is discarding the token client-side - this call is
 * best-effort and never blocks logging out.
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* already unauthenticated - nothing to do */
  }
};
