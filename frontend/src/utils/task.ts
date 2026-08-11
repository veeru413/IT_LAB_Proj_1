import type { Priority, Task, TaskStatus } from '@/types';

/** Sort order used by the priority dropdown and any client-side sorting. */
export const PRIORITY_RANK: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Alphabetical' },
] as const;

/** `HIGH` -> `High`, for display without shouting at the reader. */
export const titleCase = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/** Counts used by the dashboard tiles when computing from a local list. */
export const summarise = (tasks: Task[]) => ({
  total: tasks.length,
  pending: tasks.filter((task) => task.status === 'PENDING').length,
  completed: tasks.filter((task) => task.status === 'COMPLETED').length,
  overdue: tasks.filter((task) => task.isOverdue).length,
});
