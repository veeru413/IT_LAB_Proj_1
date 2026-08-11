import { z } from 'zod';
import { createTaskSchema } from './task.schema';

/**
 * Body for `POST /api/admin/tasks`.
 *
 * `assignTo` is either the literal "ALL" (assign to the whole class) or a list
 * of specific student ids. Selecting "ALL" creates one row per student - the
 * API never stores a task with a null owner.
 */
export const adminCreateTaskSchema = createTaskSchema.extend({
  assignTo: z.union([
    z.literal('ALL'),
    z
      .array(z.string().trim().min(1, 'Student id cannot be empty'))
      .min(1, 'Select at least one student'),
  ]),
});

export const adminStudentQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
});

export type AdminCreateTaskInput = z.infer<typeof adminCreateTaskSchema>;
export type AdminStudentQuery = z.infer<typeof adminStudentQuerySchema>;
