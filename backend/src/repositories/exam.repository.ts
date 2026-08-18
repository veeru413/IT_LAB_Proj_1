import type { Prisma, ExamAttempt, ExamQuestion } from '@prisma/client';
import { prisma } from '../config/prisma';

const attemptInclude = {
  user: { select: { id: true, name: true, email: true, studentId: true, role: true } },
} satisfies Prisma.ExamAttemptInclude;

export type ExamAttemptWithRelations = Prisma.ExamAttemptGetPayload<{
  include: typeof attemptInclude;
}>;

export const findActiveQuestions = (): Promise<ExamQuestion[]> =>
  prisma.examQuestion.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  });

export const findAllQuestions = (): Promise<ExamQuestion[]> =>
  prisma.examQuestion.findMany({ orderBy: { position: 'asc' } });

export const findQuestionById = (id: string): Promise<ExamQuestion | null> =>
  prisma.examQuestion.findUnique({ where: { id } });

export const findQuestionByPosition = (position: number): Promise<ExamQuestion | null> =>
  prisma.examQuestion.findUnique({ where: { position } });

export const countQuestions = (): Promise<number> => prisma.examQuestion.count();

export const createQuestion = (data: Prisma.ExamQuestionUncheckedCreateInput): Promise<ExamQuestion> =>
  prisma.examQuestion.create({ data });

export const updateQuestion = (
  id: string,
  data: Prisma.ExamQuestionUpdateInput,
): Promise<ExamQuestion> => prisma.examQuestion.update({ where: { id }, data });

export const deleteQuestion = (id: string): Promise<ExamQuestion> =>
  prisma.examQuestion.delete({ where: { id } });

export const findLatestAttemptByUser = async (
  userId: string,
): Promise<ExamAttemptWithRelations | null> =>
  prisma.examAttempt.findFirst({
    where: { userId },
    orderBy: { submittedAt: 'desc' },
    include: attemptInclude,
  });

export const findAllAttempts = (): Promise<ExamAttemptWithRelations[]> =>
  prisma.examAttempt.findMany({
    orderBy: { submittedAt: 'desc' },
    include: attemptInclude,
  });

export const countAttempts = (): Promise<number> => prisma.examAttempt.count();

export const averageScore = async (): Promise<number> => {
  const attempt = await prisma.examAttempt.aggregate({
    _avg: { score: true },
  });

  return Math.round(attempt._avg.score ?? 0);
};

export const createAttempt = (
  data: Prisma.ExamAttemptUncheckedCreateInput,
): Promise<ExamAttempt> => prisma.examAttempt.create({ data });
