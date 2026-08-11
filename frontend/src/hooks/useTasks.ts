import { useCallback, useEffect, useMemo, useState } from 'react';
import * as taskService from '@/services/task.service';
import { useToast } from './useToast';
import { useDebounce } from './useDebounce';
import { DEFAULT_FILTERS, toQueryParams, type FilterState } from '@/components/tasks/TaskFilters';
import type { CreateTaskPayload, Task, TaskStatus, TaskSummary } from '@/types';

interface UseTasksOptions {
  /** Locks the status filter - used by the "Completed" page. */
  fixedStatus?: TaskStatus;
}

/**
 * Owns the task list for a page: fetching, filtering and every mutation.
 *
 * Filtering, searching and sorting all happen server-side; this hook simply
 * turns UI state into query parameters and refetches when they change.
 */
export const useTasks = ({ fixedStatus }: UseTasksOptions = {}) => {
  const { notify } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<TaskSummary | undefined>();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...(fixedStatus ? { status: fixedStatus } : {}),
  });

  // Only the search term is debounced; dropdowns should feel instant.
  const debouncedSearch = useDebounce(filters.search, 300);

  const query = useMemo(
    () => toQueryParams({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await taskService.listTasks(query);
      setTasks(result.tasks);
      setSummary(result.summary);
      setSubjects(result.subjects);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const createTask = useCallback(
    async (payload: CreateTaskPayload) => {
      await taskService.createTask(payload);
      notify('Task created successfully');
      await load();
    },
    [load, notify],
  );

  const updateTask = useCallback(
    async (id: string, payload: Partial<CreateTaskPayload & { status: TaskStatus }>) => {
      await taskService.updateTask(id, payload);
      notify('Task updated successfully');
      await load();
    },
    [load, notify],
  );

  /** Flips PENDING <-> COMPLETED. */
  const toggleStatus = useCallback(
    async (task: Task) => {
      const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      setBusyTaskId(task.id);

      try {
        await taskService.updateTaskStatus(task.id, nextStatus);
        notify(
          nextStatus === 'COMPLETED' ? 'Task marked as completed' : 'Task moved back to pending',
        );
        await load();
      } catch (caught) {
        notify(caught instanceof Error ? caught.message : 'Could not update the task', 'error');
      } finally {
        setBusyTaskId(null);
      }
    },
    [load, notify],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setBusyTaskId(id);

      try {
        await taskService.deleteTask(id);
        notify('Task deleted');
        await load();
      } catch (caught) {
        notify(caught instanceof Error ? caught.message : 'Could not delete the task', 'error');
        throw caught;
      } finally {
        setBusyTaskId(null);
      }
    },
    [load, notify],
  );

  return {
    tasks,
    summary,
    subjects,
    isLoading,
    error,
    filters,
    setFilters,
    busyTaskId,
    reload: load,
    createTask,
    updateTask,
    toggleStatus,
    deleteTask,
  };
};
