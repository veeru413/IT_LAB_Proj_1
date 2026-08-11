import type { Task, User } from '@prisma/client';
import type { Priority, TaskStatus } from '../types/domain';

/** Task shape returned to clients, with derived fields added. */
export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  createdBy: string;
  /** Derived, never stored: PENDING task whose due date is in the past. */
  isOverdue: boolean;
  /** True when the task was created by somebody other than its owner (admin). */
  assignedByAdmin: boolean;
  student?: { id: string; name: string; studentId: string | null; email: string };
  creator?: { id: string; name: string; role: string };
}

type TaskWithRelations = Task & {
  student?: Pick<User, 'id' | 'name' | 'studentId' | 'email'> | null;
  creator?: Pick<User, 'id' | 'name' | 'role'> | null;
};

/**
 * Overdue is a *derived* state, not a database column.
 *
 * A task is overdue when it is still PENDING and its due date is strictly
 * before the current instant. Storing it would require a scheduled job to keep
 * rows accurate; deriving it is always correct.
 */
export const isTaskOverdue = (
  task: Pick<Task, 'status' | 'dueDate'>,
  now: Date = new Date(),
): boolean => task.status === 'PENDING' && task.dueDate.getTime() < now.getTime();

/** Serialises a Prisma task row (plus optional relations) for the API. */
export const toTaskDTO = (task: TaskWithRelations, now: Date = new Date()): TaskDTO => {
  const dto: TaskDTO = {
    id: task.id,
    title: task.title,
    description: task.description,
    subject: task.subject,
    priority: task.priority as Priority,
    status: task.status as TaskStatus,
    dueDate: task.dueDate.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    studentId: task.studentId,
    createdBy: task.createdBy,
    isOverdue: isTaskOverdue(task, now),
    assignedByAdmin: task.createdBy !== task.studentId,
  };

  if (task.student) {
    dto.student = {
      id: task.student.id,
      name: task.student.name,
      studentId: task.student.studentId,
      email: task.student.email,
    };
  }

  if (task.creator) {
    dto.creator = { id: task.creator.id, name: task.creator.name, role: task.creator.role };
  }

  return dto;
};

export const toTaskDTOs = (tasks: TaskWithRelations[]): TaskDTO[] => {
  const now = new Date();
  return tasks.map((task) => toTaskDTO(task, now));
};
