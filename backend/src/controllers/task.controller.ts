import type { Request, Response } from 'express';
import * as taskService from '../services/task.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getValidatedParams, getValidatedQuery } from '../middleware/validate';
import type {
  CreateTaskInput,
  TaskQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/task.schema';
import type { AuthenticatedUser } from '../types/domain';

/** `authenticate` guarantees this, but the check keeps TypeScript honest. */
const currentUser = (req: Request): AuthenticatedUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

const taskId = (req: Request): string => getValidatedParams<{ id: string }>(req).id;

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const user = currentUser(req);
  const query = getValidatedQuery<TaskQuery>(req);

  const [tasks, summary, subjects] = await Promise.all([
    taskService.listMyTasks(user, query),
    taskService.getMyTaskSummary(user),
    taskService.getMySubjects(user),
  ]);

  return sendSuccess(res, tasks, 200, { count: tasks.length, summary, subjects });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(taskId(req), currentUser(req));
  return sendSuccess(res, task);
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(currentUser(req), req.body as CreateTaskInput);
  return sendSuccess(res, task, 201);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(
    taskId(req),
    currentUser(req),
    req.body as UpdateTaskInput,
  );
  return sendSuccess(res, task);
});

export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as UpdateTaskStatusInput;
  const task = await taskService.updateTaskStatus(taskId(req), currentUser(req), status);
  return sendSuccess(res, task);
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(taskId(req), currentUser(req));
  return sendSuccess(res, { message: 'Task deleted successfully' });
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const user = currentUser(req);

  const [summary, upcoming] = await Promise.all([
    taskService.getMyTaskSummary(user),
    taskService.listMyTasks(user, { status: 'PENDING', sortBy: 'dueDate', order: 'asc' }),
  ]);

  return sendSuccess(res, { summary, upcoming: upcoming.slice(0, 5) });
});
