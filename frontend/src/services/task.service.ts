import { api, readMeta } from './api';
import type {
  CreateTaskPayload,
  Task,
  TaskListResult,
  TaskQueryParams,
  TaskStatus,
  TaskSummary,
} from '@/types';

/** Drops empty values so the URL only carries filters that are actually set. */
const toParams = (query: TaskQueryParams): Record<string, string> =>
  Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = String(value);
    }
    return acc;
  }, {});

export const listTasks = async (query: TaskQueryParams = {}): Promise<TaskListResult> => {
  const { data } = await api.get('/tasks', { params: toParams(query) });

  return {
    tasks: data.data as Task[],
    summary: readMeta<TaskSummary | undefined>(data.meta, 'summary', undefined),
    subjects: readMeta<string[]>(data.meta, 'subjects', []),
  };
};

export const getTask = async (id: string): Promise<Task> => {
  const { data } = await api.get(`/tasks/${id}`);
  return data.data;
};

export const getDashboard = async (): Promise<{ summary: TaskSummary; upcoming: Task[] }> => {
  const { data } = await api.get('/tasks/summary');
  return data.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const { data } = await api.post('/tasks', payload);
  return data.data;
};

export const updateTask = async (
  id: string,
  payload: Partial<CreateTaskPayload & { status: TaskStatus }>,
): Promise<Task> => {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data.data;
};

/** Dedicated endpoint for the complete / re-open toggle. */
export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task> => {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};
