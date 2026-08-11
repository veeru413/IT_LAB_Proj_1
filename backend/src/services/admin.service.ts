import * as taskRepository from '../repositories/task.repository';
import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { toTaskDTO, toTaskDTOs, type TaskDTO } from '../utils/task';
import { toUserDTO, type UserDTO } from '../utils/user';
import type { AdminCreateTaskInput } from '../schemas/admin.schema';
import type { AdminTaskQuery } from '../schemas/task.schema';
import type { AuthenticatedUser } from '../types/domain';

/** A student row on the admin "Students" screen, with task counters. */
export interface StudentWithStats extends UserDTO {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface AdminStatistics {
  totalStudents: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  completionRate: number;
}

const percentage = (part: number, total: number): number =>
  total === 0 ? 0 : Math.round((part / total) * 100);

/**
 * Builds per-student counters from two aggregate queries instead of one query
 * per student, so the admin dashboard stays fast as the class grows.
 */
const buildStudentStatsIndex = async () => {
  const [grouped, overdue] = await Promise.all([
    taskRepository.groupTaskCountsByStudent(),
    taskRepository.findOverduePendingTasks(),
  ]);

  const index = new Map<string, { pending: number; completed: number; overdue: number }>();

  const entryFor = (studentId: string) => {
    let entry = index.get(studentId);
    if (!entry) {
      entry = { pending: 0, completed: 0, overdue: 0 };
      index.set(studentId, entry);
    }
    return entry;
  };

  for (const row of grouped) {
    const entry = entryFor(row.studentId);
    if (row.status === 'COMPLETED') entry.completed += row.count;
    else entry.pending += row.count;
  }

  for (const row of overdue) {
    entryFor(row.studentId).overdue += 1;
  }

  return index;
};

/** `GET /api/admin/students` */
export const listStudents = async (search?: string): Promise<StudentWithStats[]> => {
  const [students, statsIndex] = await Promise.all([
    userRepository.findAllStudents(search),
    buildStudentStatsIndex(),
  ]);

  return students.map((student) => {
    const stats = statsIndex.get(student.id) ?? { pending: 0, completed: 0, overdue: 0 };
    const total = stats.pending + stats.completed;

    return {
      ...toUserDTO(student),
      totalTasks: total,
      completedTasks: stats.completed,
      pendingTasks: stats.pending,
      overdueTasks: stats.overdue,
      completionRate: percentage(stats.completed, total),
    };
  });
};

/** `GET /api/admin/students/:id` - profile plus that student's full task list. */
export const getStudentDetail = async (
  studentId: string,
): Promise<{ student: StudentWithStats; tasks: TaskDTO[] }> => {
  const student = await userRepository.findUserById(studentId);

  if (!student || student.role !== 'STUDENT') {
    throw ApiError.notFound('Student not found');
  }

  const tasks = await taskRepository.findTasks({ studentId, sortBy: 'dueDate', order: 'asc' });
  const dtos = toTaskDTOs(tasks);

  const completed = dtos.filter((task) => task.status === 'COMPLETED').length;
  const pending = dtos.length - completed;
  const overdue = dtos.filter((task) => task.isOverdue).length;

  return {
    student: {
      ...toUserDTO(student),
      totalTasks: dtos.length,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      completionRate: percentage(completed, dtos.length),
    },
    tasks: dtos,
  };
};

/** `GET /api/admin/tasks` - every task in the system, filterable by student. */
export const listAllTasks = async (query: AdminTaskQuery): Promise<TaskDTO[]> => {
  const tasks = await taskRepository.findTasks(query);
  return toTaskDTOs(tasks);
};

/**
 * `POST /api/admin/tasks`
 *
 * Creates one task row per target student. Choosing "ALL" fans out across the
 * whole class - a task is never stored without an owner.
 */
export const createAssignment = async (
  admin: AuthenticatedUser,
  input: AdminCreateTaskInput,
): Promise<{ created: number; tasks: TaskDTO[] }> => {
  let studentIds: string[];

  if (input.assignTo === 'ALL') {
    studentIds = await userRepository.findAllStudentIds();

    if (studentIds.length === 0) {
      throw ApiError.badRequest('There are no registered students to assign this task to');
    }
  } else {
    const uniqueIds = [...new Set(input.assignTo)];
    const students = await userRepository.findStudentsByIds(uniqueIds);

    if (students.length !== uniqueIds.length) {
      throw ApiError.badRequest('One or more selected students could not be found');
    }

    studentIds = students.map((student) => student.id);
  }

  const tasks = await taskRepository.createTasksForStudents(studentIds, {
    title: input.title,
    description: input.description ?? '',
    subject: input.subject,
    dueDate: input.dueDate,
    priority: input.priority ?? 'MEDIUM',
    status: 'PENDING',
    createdBy: admin.id, // provenance: assigned by the professor, owned by the student
  });

  return { created: tasks.length, tasks: tasks.map((task) => toTaskDTO(task)) };
};

/** `GET /api/admin/statistics` - headline numbers for the admin dashboard. */
export const getStatistics = async (): Promise<{
  statistics: AdminStatistics;
  recentTasks: TaskDTO[];
  studentProgress: StudentWithStats[];
}> => {
  const [totalStudents, totalAssignments, completedAssignments, overdueRows, recentTasks, studentProgress] =
    await Promise.all([
      userRepository.countStudents(),
      taskRepository.countTasks(),
      taskRepository.countTasks({ status: 'COMPLETED' }),
      taskRepository.findOverduePendingTasks(),
      taskRepository.findRecentTasks(8),
      listStudents(),
    ]);

  const pendingAssignments = totalAssignments - completedAssignments;

  return {
    statistics: {
      totalStudents,
      totalAssignments,
      pendingAssignments,
      completedAssignments,
      overdueAssignments: overdueRows.length,
      completionRate: percentage(completedAssignments, totalAssignments),
    },
    recentTasks: toTaskDTOs(recentTasks),
    studentProgress,
  };
};

/** Distinct subjects across all tasks - populates the admin subject filter. */
export const getAllSubjects = (): Promise<string[]> => taskRepository.findDistinctSubjects();
