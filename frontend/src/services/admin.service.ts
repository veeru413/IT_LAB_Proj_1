import { api, readMeta } from './api';
import type {
  AdminAssignmentPayload,
  AdminDashboardData,
  StudentWithStats,
  Task,
  TaskQueryParams,
} from '@/types';

const toParams = (query: TaskQueryParams): Record<string, string> =>
  Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = String(value);
    }
    return acc;
  }, {});

export const getStatistics = async (): Promise<AdminDashboardData> => {
  const { data } = await api.get('/admin/statistics');
  return data.data;
};

export const listStudents = async (search?: string): Promise<StudentWithStats[]> => {
  const { data } = await api.get('/admin/students', { params: search ? { search } : {} });
  return data.data;
};

export const getStudent = async (
  id: string,
): Promise<{ student: StudentWithStats; tasks: Task[] }> => {
  const { data } = await api.get(`/admin/students/${id}`);
  return data.data;
};

export const listAllTasks = async (
  query: TaskQueryParams = {},
): Promise<{ tasks: Task[]; subjects: string[] }> => {
  const { data } = await api.get('/admin/tasks', { params: toParams(query) });
  return { tasks: data.data, subjects: readMeta<string[]>(data.meta, 'subjects', []) };
};

/**
 * Creates the assignment. When `assignTo` is "ALL" the server fans it out into
 * one task per student, so `created` reports how many rows were written.
 */
export const createAssignment = async (
  payload: AdminAssignmentPayload,
): Promise<{ created: number; tasks: Task[] }> => {
  const { data } = await api.post('/admin/tasks', payload);
  return data.data;
};
