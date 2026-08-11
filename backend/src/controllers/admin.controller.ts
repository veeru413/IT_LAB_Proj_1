import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getValidatedParams, getValidatedQuery } from '../middleware/validate';
import type { AdminCreateTaskInput, AdminStudentQuery } from '../schemas/admin.schema';
import type { AdminTaskQuery } from '../schemas/task.schema';
import type { AuthenticatedUser } from '../types/domain';

const currentUser = (req: Request): AuthenticatedUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const { search } = getValidatedQuery<AdminStudentQuery>(req);
  const students = await adminService.listStudents(search);
  return sendSuccess(res, students, 200, { count: students.length });
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidatedParams<{ id: string }>(req);
  const detail = await adminService.getStudentDetail(id);
  return sendSuccess(res, detail);
});

export const listAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const query = getValidatedQuery<AdminTaskQuery>(req);

  const [tasks, subjects] = await Promise.all([
    adminService.listAllTasks(query),
    adminService.getAllSubjects(),
  ]);

  return sendSuccess(res, tasks, 200, { count: tasks.length, subjects });
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.createAssignment(
    currentUser(req),
    req.body as AdminCreateTaskInput,
  );

  return sendSuccess(res, result, 201, {
    message: `Assignment created for ${result.created} student${result.created === 1 ? '' : 's'}`,
  });
});

export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getStatistics();
  return sendSuccess(res, data);
});
