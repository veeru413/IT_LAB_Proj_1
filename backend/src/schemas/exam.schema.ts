import { z } from 'zod';
import { QUESTION_OPTIONS } from '../types/domain';

const questionOptionSchema = z.enum(QUESTION_OPTIONS);

export const examQuestionSchema = z.object({
  questionText: z
    .string()
    .trim()
    .min(5, 'Question text must be at least 5 characters long')
    .max(300, 'Question text must be at most 300 characters long'),
  optionA: z.string().trim().min(1, 'Option A is required').max(200),
  optionB: z.string().trim().min(1, 'Option B is required').max(200),
  optionC: z.string().trim().min(1, 'Option C is required').max(200),
  optionD: z.string().trim().min(1, 'Option D is required').max(200),
  correctOption: questionOptionSchema,
  explanation: z.string().trim().max(500).optional().default(''),
  subject: z.string().trim().min(2, 'Subject is required').max(80),
  position: z.coerce.number().int().min(1).max(10),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateExamQuestionSchema = examQuestionSchema.partial().extend({
  questionText: z
    .string()
    .trim()
    .min(5, 'Question text must be at least 5 characters long')
    .max(300, 'Question text must be at most 300 characters long')
    .optional(),
  optionA: z.string().trim().min(1, 'Option A is required').max(200).optional(),
  optionB: z.string().trim().min(1, 'Option B is required').max(200).optional(),
  optionC: z.string().trim().min(1, 'Option C is required').max(200).optional(),
  optionD: z.string().trim().min(1, 'Option D is required').max(200).optional(),
  correctOption: questionOptionSchema.optional(),
  explanation: z.string().trim().max(500).optional(),
  subject: z.string().trim().min(2, 'Subject is required').max(80).optional(),
  position: z.coerce.number().int().min(1).max(10).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const submitExamSchema = z.object({
  startedAt: z.string().datetime().optional(),
  elapsedSeconds: z.coerce.number().int().min(0).optional(),
  answers: z.record(questionOptionSchema),
});

export type ExamQuestionInput = z.infer<typeof examQuestionSchema>;
export type UpdateExamQuestionInput = z.infer<typeof updateExamQuestionSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
