import { z } from 'zod';

/**
 * Password policy, expressed once and reused by register + any future
 * "change password" flow. Deliberately reasonable rather than draconian:
 * length is the property that actually matters.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be at most 72 characters long') // bcrypt input limit
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(80, 'Full name must be at most 80 characters long'),
    studentId: z
      .string()
      .trim()
      .min(2, 'Student ID is required')
      .max(30, 'Student ID must be at most 30 characters long')
      .regex(/^[A-Za-z0-9._/-]+$/, 'Student ID may only contain letters, numbers, . _ - /'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
