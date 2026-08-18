import type { ExamAttempt, ExamQuestion, User } from '@prisma/client';
import type { QuestionOption } from '../types/domain';

export interface ExamQuestionDTO {
  id: string;
  position: number;
  questionText: string;
  options: Record<QuestionOption, string>;
  subject: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  explanation?: string;
  correctOption?: QuestionOption;
}

export interface ExamAttemptDTO {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    role: string;
  };
  answers: Record<string, QuestionOption>;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  startedAt: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSessionDTO {
  title: string;
  durationSeconds: number;
  totalQuestions: number;
}

type QuestionWithTiming = Pick<ExamQuestion, 'id' | 'position' | 'questionText' | 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'subject' | 'isActive' | 'createdAt' | 'updatedAt' | 'correctOption' | 'explanation'>;

export const toExamQuestionDTO = (
  question: QuestionWithTiming,
  includeAnswerKey = false,
): ExamQuestionDTO => ({
  id: question.id,
  position: question.position,
  questionText: question.questionText,
  options: {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  },
  subject: question.subject,
  isActive: question.isActive,
  createdAt: question.createdAt.toISOString(),
  updatedAt: question.updatedAt.toISOString(),
  ...(includeAnswerKey
    ? { correctOption: question.correctOption as QuestionOption, explanation: question.explanation }
    : {}),
});

export const toExamQuestionDTOs = (
  questions: QuestionWithTiming[],
  includeAnswerKey = false,
): ExamQuestionDTO[] => questions.map((question) => toExamQuestionDTO(question, includeAnswerKey));

export const parseAnswers = (answersJson: string): Record<string, QuestionOption> => {
  try {
    return JSON.parse(answersJson) as Record<string, QuestionOption>;
  } catch {
    return {};
  }
};

export const toExamAttemptDTO = (
  attempt: ExamAttempt & {
    user?: Pick<User, 'id' | 'name' | 'email' | 'studentId' | 'role'> | null;
  },
): ExamAttemptDTO => ({
  id: attempt.id,
  userId: attempt.userId,
  user: attempt.user
    ? {
        id: attempt.user.id,
        name: attempt.user.name,
        email: attempt.user.email,
        studentId: attempt.user.studentId,
        role: attempt.user.role,
      }
    : undefined,
  answers: parseAnswers(attempt.answersJson),
  score: attempt.score,
  totalQuestions: attempt.totalQuestions,
  durationSeconds: attempt.durationSeconds,
  startedAt: attempt.startedAt.toISOString(),
  submittedAt: attempt.submittedAt.toISOString(),
  createdAt: attempt.createdAt.toISOString(),
  updatedAt: attempt.updatedAt.toISOString(),
});

export const gradeExam = (
  answers: Record<string, QuestionOption>,
  questions: Array<Pick<ExamQuestion, 'id' | 'correctOption'>>,
) => {
  let score = 0;

  for (const question of questions) {
    if (answers[question.id] === (question.correctOption as QuestionOption)) {
      score += 1;
    }
  }

  return score;
};
