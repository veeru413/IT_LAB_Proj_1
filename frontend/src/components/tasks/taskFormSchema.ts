import { z } from 'zod';

/**
 * Client-side form schema.
 *
 * This mirrors the backend Zod schema to give instant feedback - it is a UX
 * convenience, not a security control. The server validates every request
 * independently, so bypassing this changes nothing.
 */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(120, 'Title must be at most 120 characters long'),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  subject: z
    .string()
    .trim()
    .min(2, 'Subject must be at least 2 characters long')
    .max(60, 'Subject must be at most 60 characters long'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'COMPLETED']).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Admin assignment form: the task fields plus a target audience. */
export const assignmentFormSchema = taskFormSchema.omit({ status: true }).extend({
  assignTo: z.string().min(1, 'Choose who this assignment is for'),
  studentIds: z.array(z.string()).optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
