import type { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getValidatedParams } from '../middleware/validate';
import * as examService from '../services/exam.service';
import type {
  ExamQuestionInput,
  SubmitExamInput,
  UpdateExamQuestionInput,
} from '../schemas/exam.schema';
import type { AuthenticatedUser } from '../types/domain';

const currentUser = (req: Request): AuthenticatedUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await examService.getExamSession(currentUser(req));
  return sendSuccess(res, data);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const result = await examService.submitExam(currentUser(req), req.body as SubmitExamInput);
  return sendSuccess(res, result, 201);
});

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await examService.getAdminDashboard();
  return sendSuccess(res, data);
});

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questions = await examService.listQuestions(currentUser(req), true);
  return sendSuccess(res, questions, 200, { count: questions.length });
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await examService.createQuestion(
    currentUser(req),
    req.body as ExamQuestionInput,
  );
  return sendSuccess(res, question, 201);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidatedParams<{ id: string }>(req);
  const question = await examService.updateQuestion(
    currentUser(req),
    id,
    req.body as UpdateExamQuestionInput,
  );
  return sendSuccess(res, question);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidatedParams<{ id: string }>(req);
  await examService.deleteQuestion(currentUser(req), id);
  return sendSuccess(res, { message: 'Question deleted successfully' });
});
