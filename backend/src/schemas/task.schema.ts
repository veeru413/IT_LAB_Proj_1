import { z } from 'zod';
import { PRIORITIES, SORT_ORDERS, TASK_SORT_FIELDS, TASK_STATUSES } from '../types/domain';

/** Accepts `2026-08-15` or a full ISO timestamp and normalises to a Date. */
const dueDateSchema = z
  .string()
  .trim()
  .min(1, 'Due date is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid due date')
  .transform((value) => new Date(value));

export const prioritySchema = z.enum(PRIORITIES, {
  errorMap: () => ({ message: 'Priority must be LOW, MEDIUM or HIGH' }),
});

export const statusSchema = z.enum(TASK_STATUSES, {
  errorMap: () => ({ message: 'Status must be PENDING or COMPLETED' }),
});

/** Body for `POST /api/tasks`. The owner is taken from the JWT, never the body. */
export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(120, 'Title must be at most 120 characters long'),
  description: z.string().trim().max(2000, 'Description is too long').optional().default(''),
  subject: z
    .string()
    .trim()
    .min(2, 'Subject must be at least 2 characters long')
    .max(60, 'Subject must be at most 60 characters long'),
  dueDate: dueDateSchema,
  priority: prioritySchema.optional().default('MEDIUM'),
});

/** Body for `PUT /api/tasks/:id`. Every field is optional (partial update). */
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(120),
    description: z.string().trim().max(2000, 'Description is too long'),
    subject: z.string().trim().min(2, 'Subject must be at least 2 characters long').max(60),
    dueDate: dueDateSchema,
    priority: prioritySchema,
    status: statusSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

/** Body for `PATCH /api/tasks/:id/status`. */
export const updateTaskStatusSchema = z.object({
  status: statusSchema,
});

/** Query parameters for `GET /api/tasks`. */
export const taskQuerySchema = z.object({
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  subject: z.string().trim().min(1).max(60).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  /** `true` narrows results to PENDING tasks whose due date has passed. */
  overdue: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  sortBy: z.enum(TASK_SORT_FIELDS).optional().default('dueDate'),
  order: z.enum(SORT_ORDERS).optional().default('asc'),
});

/** Admin task listing supports the same filters plus a student filter. */
export const adminTaskQuerySchema = taskQuerySchema.extend({
  studentId: z.string().trim().min(1).optional(),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid id is required'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type AdminTaskQuery = z.infer<typeof adminTaskQuerySchema>;
