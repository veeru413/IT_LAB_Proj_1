import * as examRepository from '../repositories/exam.repository';
import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import {
  gradeExam,
  toExamAttemptDTO,
  toExamQuestionDTOs,
  type ExamAttemptDTO,
  type ExamQuestionDTO,
  type ExamSessionDTO,
} from '../utils/exam';
import type {
  ExamQuestionInput,
  SubmitExamInput,
  UpdateExamQuestionInput,
} from '../schemas/exam.schema';
import type { AuthenticatedUser, QuestionOption } from '../types/domain';

const EXAM_TITLE = 'MCQ Examination';
const EXAM_DURATION_SECONDS = 15 * 60;

const ensureStudent = (user: AuthenticatedUser): void => {
  if (user.role !== 'STUDENT') {
    throw ApiError.forbidden('Only students can take the exam');
  }
};

const ensureStaff = (user: AuthenticatedUser): void => {
  if (user.role !== 'ADMIN' && user.role !== 'EXAMINER') {
    throw ApiError.forbidden('You do not have permission to manage questions');
  }
};

const resolveStartedAt = (input: SubmitExamInput): Date => {
  if (input.startedAt) return new Date(input.startedAt);
  const elapsedSeconds = input.elapsedSeconds ?? 0;
  return new Date(Date.now() - elapsedSeconds * 1000);
};

export const getExamSession = async (
  user: AuthenticatedUser,
): Promise<{
  exam: ExamSessionDTO;
  questions: ExamQuestionDTO[];
  latestAttempt: ExamAttemptDTO | null;
}> => {
  ensureStudent(user);

  const [questions, latestAttempt] = await Promise.all([
    examRepository.findActiveQuestions(),
    examRepository.findLatestAttemptByUser(user.id),
  ]);

  return {
    exam: {
      title: EXAM_TITLE,
      durationSeconds: EXAM_DURATION_SECONDS,
      totalQuestions: questions.length,
    },
    questions: toExamQuestionDTOs(questions),
    latestAttempt: latestAttempt ? toExamAttemptDTO(latestAttempt) : null,
  };
};

export const submitExam = async (
  user: AuthenticatedUser,
  input: SubmitExamInput,
): Promise<{
  attempt: ExamAttemptDTO;
  score: number;
  totalQuestions: number;
  percentage: number;
}> => {
  ensureStudent(user);

  const [questions, existingAttempt] = await Promise.all([
    examRepository.findActiveQuestions(),
    examRepository.findLatestAttemptByUser(user.id),
  ]);

  if (existingAttempt) {
    throw ApiError.conflict('You have already submitted this exam. Only one attempt is allowed.');
  }

  if (questions.length === 0) {
    throw ApiError.badRequest('No exam questions are available yet');
  }

  const score = gradeExam(input.answers as Record<string, QuestionOption>, questions);
  const startedAt = resolveStartedAt(input);
  const durationSeconds = input.elapsedSeconds ?? EXAM_DURATION_SECONDS;

  const attempt = await examRepository.createAttempt({
    userId: user.id,
    answersJson: JSON.stringify(input.answers),
    score,
    totalQuestions: questions.length,
    durationSeconds,
    startedAt,
  });

  const percentage = Math.round((score / questions.length) * 100);

  return {
    attempt: toExamAttemptDTO(attempt),
    score,
    totalQuestions: questions.length,
    percentage,
  };
};

export const listQuestions = async (
  user: AuthenticatedUser,
  includeAnswerKey = false,
): Promise<ExamQuestionDTO[]> => {
  ensureStaff(user);
  const questions = await examRepository.findAllQuestions();
  return toExamQuestionDTOs(questions, includeAnswerKey);
};

export const createQuestion = async (
  user: AuthenticatedUser,
  input: ExamQuestionInput,
): Promise<ExamQuestionDTO> => {
  ensureStaff(user);

  const existingAtPosition = await examRepository.findQuestionByPosition(input.position);

  if (existingAtPosition) {
    throw ApiError.conflict(
      `Question ${input.position} already exists. Edit that question or choose an empty position.`,
    );
  }

  const question = await examRepository.createQuestion({
    questionText: input.questionText,
    optionA: input.optionA,
    optionB: input.optionB,
    optionC: input.optionC,
    optionD: input.optionD,
    correctOption: input.correctOption,
    explanation: input.explanation ?? '',
    subject: input.subject,
    position: input.position,
    isActive: input.isActive ?? true,
  });

  return toExamQuestionDTOs([question], true)[0];
};

export const updateQuestion = async (
  user: AuthenticatedUser,
  questionId: string,
  input: UpdateExamQuestionInput,
): Promise<ExamQuestionDTO> => {
  ensureStaff(user);
  const current = await examRepository.findQuestionById(questionId);

  if (!current) {
    throw ApiError.notFound('Question not found');
  }

  if (input.position !== undefined && input.position !== current.position) {
    const existingAtPosition = await examRepository.findQuestionByPosition(input.position);

    if (existingAtPosition) {
      throw ApiError.conflict(
        `Question ${input.position} already exists. Choose a different position.`,
      );
    }
  }

  const question = await examRepository.updateQuestion(questionId, {
    ...(input.questionText !== undefined && { questionText: input.questionText }),
    ...(input.optionA !== undefined && { optionA: input.optionA }),
    ...(input.optionB !== undefined && { optionB: input.optionB }),
    ...(input.optionC !== undefined && { optionC: input.optionC }),
    ...(input.optionD !== undefined && { optionD: input.optionD }),
    ...(input.correctOption !== undefined && { correctOption: input.correctOption }),
    ...(input.explanation !== undefined && { explanation: input.explanation }),
    ...(input.subject !== undefined && { subject: input.subject }),
    ...(input.position !== undefined && { position: input.position }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  });

  return toExamQuestionDTOs([question], true)[0];
};

export const deleteQuestion = async (user: AuthenticatedUser, questionId: string): Promise<void> => {
  ensureStaff(user);
  const current = await examRepository.findQuestionById(questionId);

  if (!current) {
    throw ApiError.notFound('Question not found');
  }

  await examRepository.deleteQuestion(questionId);
};

export const getAdminDashboard = async (): Promise<{
  statistics: {
    totalStudents: number;
    totalExaminers: number;
    totalQuestions: number;
    totalAttempts: number;
    averageScore: number;
  };
  questions: ExamQuestionDTO[];
  attempts: ExamAttemptDTO[];
}> => {
  const [totalStudents, totalExaminers, totalQuestions, totalAttempts, averageScore, questions, attempts] =
    await Promise.all([
      userRepository.countStudents(),
      userRepository.countExaminers(),
      examRepository.countQuestions(),
      examRepository.countAttempts(),
      examRepository.averageScore(),
      examRepository.findAllQuestions(),
      examRepository.findAllAttempts(),
    ]);

  return {
    statistics: {
      totalStudents,
      totalExaminers,
      totalQuestions,
      totalAttempts,
      averageScore,
    },
    questions: toExamQuestionDTOs(questions, true),
    attempts: attempts.map((attempt) => toExamAttemptDTO(attempt)),
  };
};
