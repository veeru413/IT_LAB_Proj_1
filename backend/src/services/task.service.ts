import * as taskRepository from '../repositories/task.repository';
import { ApiError } from '../utils/ApiError';
import { toTaskDTO, toTaskDTOs, isTaskOverdue, type TaskDTO } from '../utils/task';
import type { CreateTaskInput, TaskQuery, UpdateTaskInput } from '../schemas/task.schema';
import type { AuthenticatedUser, TaskStatus } from '../types/domain';

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

/**
 * Loads a task and asserts the caller is allowed to touch it.
 *
 * This single guard is the reason a student can never read, edit or delete
 * another student's task: every task endpoint routes through it.
 */
const getOwnedTask = async (taskId: string, user: AuthenticatedUser) => {
  const task = await taskRepository.findTaskById(taskId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Admins may inspect any task; students are restricted to their own.
  if (task.studentId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to access this task');
  }

  return task;
};

/** Tasks owned by the caller, with search / filter / sort applied. */
export const listMyTasks = async (
  user: AuthenticatedUser,
  query: TaskQuery,
): Promise<TaskDTO[]> => {
  const tasks = await taskRepository.findTasks({ ...query, studentId: user.id });
  return toTaskDTOs(tasks);
};

export const getTaskById = async (taskId: string, user: AuthenticatedUser): Promise<TaskDTO> => {
  const task = await getOwnedTask(taskId, user);
  return toTaskDTO(task);
};

/**
 * Creates a task owned by the caller.
 *
 * `studentId` is taken from the authenticated session, never from the request
 * body, so a student cannot push work onto somebody else's dashboard.
 */
export const createTask = async (
  user: AuthenticatedUser,
  input: CreateTaskInput,
): Promise<TaskDTO> => {
  const task = await taskRepository.createTask({
    title: input.title,
    description: input.description ?? '',
    subject: input.subject,
    dueDate: input.dueDate,
    priority: input.priority ?? 'MEDIUM',
    status: 'PENDING', // new tasks always start pending
    studentId: user.id,
    createdBy: user.id,
  });

  return toTaskDTO(task);
};

export const updateTask = async (
  taskId: string,
  user: AuthenticatedUser,
  input: UpdateTaskInput,
): Promise<TaskDTO> => {
  await getOwnedTask(taskId, user);

  const updated = await taskRepository.updateTask(taskId, {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.subject !== undefined && { subject: input.subject }),
    ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.status !== undefined && { status: input.status }),
  });

  return toTaskDTO(updated);
};

/** Toggle endpoint behind `PATCH /api/tasks/:id/status`. */
export const updateTaskStatus = async (
  taskId: string,
  user: AuthenticatedUser,
  status: TaskStatus,
): Promise<TaskDTO> => {
  await getOwnedTask(taskId, user);
  const updated = await taskRepository.updateTask(taskId, { status });
  return toTaskDTO(updated);
};

export const deleteTask = async (taskId: string, user: AuthenticatedUser): Promise<void> => {
  await getOwnedTask(taskId, user);
  await taskRepository.deleteTask(taskId);
};

/** Counters shown on the student dashboard. */
export const getMyTaskSummary = async (user: AuthenticatedUser): Promise<TaskSummary> => {
  const tasks = await taskRepository.findTasks({ studentId: user.id });
  const now = new Date();

  return tasks.reduce<TaskSummary>(
    (summary, task) => {
      summary.total += 1;
      if (task.status === 'COMPLETED') summary.completed += 1;
      else summary.pending += 1;
      if (isTaskOverdue(task, now)) summary.overdue += 1;
      return summary;
    },
    { total: 0, pending: 0, completed: 0, overdue: 0 },
  );
};

/** Distinct subjects owned by the caller - powers the subject filter. */
export const getMySubjects = (user: AuthenticatedUser): Promise<string[]> =>
  taskRepository.findDistinctSubjects(user.id);
