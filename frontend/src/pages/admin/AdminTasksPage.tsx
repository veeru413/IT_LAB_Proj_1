import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FilePlus2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Field';
import { Alert, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/tasks/TaskCard';
import {
  DEFAULT_FILTERS,
  TaskFilters,
  hasActiveFilters,
  toQueryParams,
  type FilterState,
} from '@/components/tasks/TaskFilters';
import * as adminService from '@/services/admin.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { StudentWithStats, Task } from '@/types';

/** `/admin/tasks` - every task in the system, filterable by student. */
export const AdminTasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [studentId, setStudentId] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);

  const query = useMemo(
    () => ({
      ...toQueryParams({ ...filters, search: debouncedSearch }),
      ...(studentId && { studentId }),
    }),
    [filters, debouncedSearch, studentId],
  );

  // Student list is fetched once - it populates the "assigned to" filter.
  useEffect(() => {
    let cancelled = false;

    adminService
      .listStudents()
      .then((result) => {
        if (!cancelled) setStudents(result);
      })
      .catch(() => {
        /* the task list surfaces any connection problem already */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.listAllTasks(query);
      setTasks(result.tasks);
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

  const filtersAreActive = hasActiveFilters(filters) || studentId !== '';

  return (
    <div>
      <PageHeader
        title="All tasks"
        description="Every assignment across all students, with the same search and filters."
        actions={
          <Link to="/admin/tasks/create">
            <Button leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden="true" />}>
              Create assignment
            </Button>
          </Link>
        }
      />

      <TaskFilters filters={filters} subjects={subjects} onChange={setFilters}>
        {/* Admin-only extra control, slotted into the shared toolbar. */}
        <div className="min-w-[180px] flex-1 sm:flex-none">
          <label htmlFor="filter-student" className="mb-1 block text-xs font-medium text-slate-500">
            Student
          </label>
          <Select
            id="filter-student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            <option value="">All students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </Select>
        </div>
      </TaskFilters>

      {error && <Alert className="mb-6">{error}</Alert>}

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={
            filtersAreActive ? (
              <SearchX className="h-6 w-6" aria-hidden="true" />
            ) : (
              <ClipboardList className="h-6 w-6" aria-hidden="true" />
            )
          }
          title={filtersAreActive ? 'No matching tasks' : 'No tasks yet'}
          message={
            filtersAreActive
              ? 'Try a different search term, or clear the filters to see everything.'
              : 'Create an assignment to hand work out to the class.'
          }
          action={
            filtersAreActive ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setStudentId('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Link to="/admin/tasks/create">
                <Button>Create assignment</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{tasks.length}</span>{' '}
            {tasks.length === 1 ? 'task' : 'tasks'}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} showOwner />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
