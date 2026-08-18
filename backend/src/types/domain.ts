/**
 * Domain-level union types.
 *
 * SQLite has no native enum support in Prisma, so these unions are the single
 * source of truth for the allowed values. Zod schemas mirror them at the API
 * boundary and the DB columns carry matching defaults.
 */

export const ROLES = ['STUDENT', 'EXAMINER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ['PENDING', 'COMPLETED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_SORT_FIELDS = ['dueDate', 'createdAt', 'priority', 'title'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/**
 * Ranking used when sorting by priority. SQLite would order the raw strings
 * alphabetically ("HIGH" < "LOW" < "MEDIUM"), which is not what a user means
 * by "sort by priority", so the ordering is applied in the repository layer.
 */
export const PRIORITY_RANK: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/** JWT payload embedded in every access token. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** The authenticated principal attached to `req.user` by the auth middleware. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId: string | null;
}

export const QUESTION_OPTIONS = ['A', 'B', 'C', 'D'] as const;
export type QuestionOption = (typeof QUESTION_OPTIONS)[number];
