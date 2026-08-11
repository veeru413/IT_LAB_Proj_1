import { useState } from 'react';
import { ClipboardList, Plus, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Alert, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters, DEFAULT_FILTERS, hasActiveFilters } from '@/components/tasks/TaskFilters';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import type { TaskFormValues } from '@/components/tasks/taskFormSchema';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types';

interface TasksPageProps {
  /** "Completed" reuses this page with the status locked. */
  fixedStatus?: TaskStatus;
  title?: string;
  description?: string;
}

/**
 * Full task list with search, filters and sorting.
 *
 * Also backs `/completed` - the only difference is a locked status filter and
 * a different heading, so there is one implementation instead of two.
 */
export const TasksPage = ({
  fixedStatus,
  title = 'My tasks',
  description = 'Search, filter and manage every assignment you are tracking.',
}: TasksPageProps) => {
  const {
    tasks,
    subjects,
    isLoading,
    error,
    filters,
    setFilters,
    busyTaskId,
    createTask,
    updateTask,
    toggleStatus,
    deleteTask,
  } = useTasks({ fixedStatus });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingTask(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: TaskFormValues) => {
    setFormError(null);

    const payload = {
      title: values.title,
      description: values.description ?? '',
      subject: values.subject,
      dueDate: values.dueDate,
      priority: values.priority,
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, { ...payload, status: values.status });
      } else {
        await createTask(payload);
      }

      setIsFormOpen(false);
      setEditingTask(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save the task');
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch {
      /* the hook already reported this via a toast */
    }
  };

  const filtersAreActive = hasActiveFilters({
    ...filters,
    // A locked status is not a user-applied filter.
    status: fixedStatus ? DEFAULT_FILTERS.status : filters.status,
  });

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openCreateForm} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Add new task
          </Button>
        }
      />

      {!fixedStatus && (
        <TaskFilters filters={filters} subjects={subjects} onChange={setFilters} />
      )}

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
              : fixedStatus === 'COMPLETED'
                ? 'Tasks you mark as completed will appear here.'
                : 'Create your first assignment to start tracking deadlines and priorities.'
          }
          action={
            filtersAreActive ? (
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={openCreateForm} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Add new task
              </Button>
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
              <TaskCard
                key={task.id}
                task={task}
                isBusy={busyTaskId === task.id}
                onEdit={(target) => {
                  setEditingTask(target);
                  setFormError(null);
                  setIsFormOpen(true);
                }}
                onToggleStatus={toggleStatus}
                onDelete={setTaskToDelete}
              />
            ))}
          </div>
        </>
      )}

      <TaskFormModal
        isOpen={isFormOpen}
        task={editingTask}
        serverError={formError}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Delete task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        isLoading={busyTaskId === taskToDelete?.id}
        onConfirm={handleDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

/** `/completed` - the same list, locked to completed work. */
export const CompletedTasksPage = () => (
  <TasksPage
    fixedStatus="COMPLETED"
    title="Completed tasks"
    description="Everything you have finished. Reopen a task to move it back to pending."
  />
);
