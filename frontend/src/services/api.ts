import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiErrorShape, FieldErrors } from '@/types';

/** Key under which the JWT is kept. Centralised so nothing hard-codes it. */
export const TOKEN_STORAGE_KEY = 'stm.auth.token';

/**
 * Fired when the API rejects the stored token (401). `AuthContext` listens for
 * it and clears the session, so an expired token logs the user out everywhere
 * instead of leaving broken pages behind.
 */
export const UNAUTHORIZED_EVENT = 'stm:unauthorized';

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY);
export const setStoredToken = (token: string): void =>
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
export const clearStoredToken = (): void => localStorage.removeItem(TOKEN_STORAGE_KEY);

/** Envelope every endpoint returns on success. */
interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ErrorEnvelope {
  success: false;
  message: string;
  errors?: FieldErrors;
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach the bearer token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Turns any axios failure into a predictable `ApiErrorShape`. */
export class ApiRequestError extends Error implements ApiErrorShape {
  status: number;
  fieldErrors?: FieldErrors;

  constructor(message: string, status: number, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorEnvelope>) => {
    // No response at all - server down, DNS failure, timeout.
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Cannot reach the server. Is the backend running on port 5000?';
      return Promise.reject(new ApiRequestError(message, 0));
    }

    const { status, data } = error.response;
    const message = data?.message ?? 'Something went wrong. Please try again.';

    // An invalid/expired token must end the session everywhere.
    if (status === 401) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { message } }));
    }

    return Promise.reject(new ApiRequestError(message, status, data?.errors));
  },
);

/** Unwraps `{ success, data }` so callers work with the payload directly. */
export const unwrap = <T>(envelope: SuccessEnvelope<T>): T => envelope.data;

/** Reads a value out of the response `meta` block with a fallback. */
export const readMeta = <T>(
  meta: Record<string, unknown> | undefined,
  key: string,
  fallback: T,
): T => (meta && key in meta ? (meta[key] as T) : fallback);
