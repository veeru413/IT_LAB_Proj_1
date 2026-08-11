import type { Prisma, Task } from '@prisma/client';
import { prisma } from '../config/prisma';
import { PRIORITY_RANK, type Priority, type SortOrder, type TaskSortField } from '../types/domain';

/** Relations that are useful on admin screens (who owns / who assigned). */
const taskWithRelations = {
  student: { select: { id: true, name: true, studentId: true, email: true } },
  creator: { select: { id: true, name: true, role: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskWithRelations }>;

export interface TaskFilters {
  studentId?: string;
  status?: string;
  priority?: string;
  subject?: string;
  search?: string;
  overdue?: boolean;
  sortBy?: TaskSortField;
  order?: SortOrder;
}

/**
 * Translates API filters into a Prisma `where` clause.
 *
 * `contains` compiles to SQL `LIKE`, which SQLite evaluates case-insensitively
 * for ASCII text - exactly the behaviour a search box should have.
 */
const buildWhere = (filters: TaskFilters): Prisma.TaskWhereInput => {
  const where: Prisma.TaskWhereInput = {};

  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.subject) where.subject = filters.subject;

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { subject: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  // Overdue is derived, so it is expressed as a query rather than a column.
  if (filters.overdue === true) {
    where.status = 'PENDING';
    where.dueDate = { lt: new Date() };
  } else if (filters.overdue === false) {
    where.NOT = [{ status: 'PENDING', dueDate: { lt: new Date() } }];
  }

  return where;
};

/**
 * Priority is stored as text, so the database would order it alphabetically
 * ("HIGH" < "LOW" < "MEDIUM"). Sorting by rank is therefore done in memory -
 * safe here because a task list is scoped to one student (or one class).
 */
const sortByPriority = <T extends Pick<Task, 'priority' | 'dueDate'>>(
  tasks: T[],
  order: SortOrder,
): T[] =>
  [...tasks].sort((a, b) => {
    const diff =
      (PRIORITY_RANK[b.priority as Priority] ?? 0) - (PRIORITY_RANK[a.priority as Priority] ?? 0);
    const ranked = order === 'asc' ? -diff : diff;
    // Equal priority falls back to the nearest deadline first.
    return ranked !== 0 ? ranked : a.dueDate.getTime() - b.dueDate.getTime();
  });

const buildOrderBy = (
  sortBy: TaskSortField,
  order: SortOrder,
): Prisma.TaskOrderByWithRelationInput[] => {
  switch (sortBy) {
    case 'title':
      return [{ title: order }];
    case 'createdAt':
      return [{ createdAt: order }];
    case 'priority':
      // Re-sorted in memory afterwards; deadline keeps the result deterministic.
      return [{ dueDate: 'asc' }];
    case 'dueDate':
    default:
      return [{ dueDate: order }, { createdAt: 'desc' }];
  }
};

export const findTasks = async (filters: TaskFilters): Promise<TaskWithRelations[]> => {
  const sortBy = filters.sortBy ?? 'dueDate';
  const order = filters.order ?? 'asc';

  const tasks = await prisma.task.findMany({
    where: buildWhere(filters),
    orderBy: buildOrderBy(sortBy, order),
    include: taskWithRelations,
  });

  return sortBy === 'priority' ? sortByPriority(tasks, order) : tasks;
};

export const findTaskById = (id: string): Promise<TaskWithRelations | null> =>
  prisma.task.findUnique({ where: { id }, include: taskWithRelations });

export const createTask = (data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithRelations> =>
  prisma.task.create({ data, include: taskWithRelations });

/**
 * Creates one row per student inside a single transaction, so assigning an
 * assignment to a whole class either fully succeeds or fully rolls back.
 */
export const createTasksForStudents = async (
  studentIds: string[],
  data: Omit<Prisma.TaskUncheckedCreateInput, 'studentId'>,
): Promise<TaskWithRelations[]> =>
  prisma.$transaction(
    studentIds.map((studentId) =>
      prisma.task.create({ data: { ...data, studentId }, include: taskWithRelations }),
    ),
  );

export const updateTask = (
  id: string,
  data: Prisma.TaskUpdateInput,
): Promise<TaskWithRelations> =>
  prisma.task.update({ where: { id }, data, include: taskWithRelations });

export const deleteTask = (id: string): Promise<Task> => prisma.task.delete({ where: { id } });

export const countTasks = (where: Prisma.TaskWhereInput = {}): Promise<number> =>
  prisma.task.count({ where });

/** One row per (student, status) pair. */
export interface TaskCountByStudent {
  studentId: string;
  status: string;
  count: number;
}

/** Per-student totals, computed with a single GROUP BY instead of N+1 queries. */
export const groupTaskCountsByStudent = async (): Promise<TaskCountByStudent[]> => {
  const rows = await prisma.task.groupBy({
    by: ['studentId', 'status'],
    _count: { _all: true },
  });

  return rows.map((row) => ({
    studentId: row.studentId,
    status: row.status,
    count: row._count._all,
  }));
};

/** Pending tasks already past their due date, grouped per student. */
export const findOverduePendingTasks = (): Promise<Array<{ studentId: string }>> =>
  prisma.task.findMany({
    where: { status: 'PENDING', dueDate: { lt: new Date() } },
    select: { studentId: true },
  });

export const findRecentTasks = (limit: number): Promise<TaskWithRelations[]> =>
  prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: taskWithRelations,
  });

/** Distinct subject list, used to populate the subject filter dropdown. */
export const findDistinctSubjects = async (studentId?: string): Promise<string[]> => {
  const rows = await prisma.task.findMany({
    where: studentId ? { studentId } : {},
    select: { subject: true },
    distinct: ['subject'],
    orderBy: { subject: 'asc' },
  });
  return rows.map((row) => row.subject);
};
