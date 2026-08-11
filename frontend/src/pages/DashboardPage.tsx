import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck2, CheckCircle2, ClipboardList, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, EmptyState, SkeletonList } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { TaskFormValues } from '@/components/tasks/taskFormSchema';
import * as taskService from '@/services/task.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { Task, TaskSummary } from '@/types';

/**
 * Student landing page: headline counters plus the deadlines that need
 * attention next.
 */
export const DashboardPage = () => {
  const { user } = useAuth();
  const { notify } = useToast();

  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await taskService.getDashboard();
      setSummary(data.summary);
      setUpcoming(data.upcoming);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load your dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (values: TaskFormValues) => {
    setFormError(null);

    try {
      const payload = {
        title: values.title,
        description: values.description ?? '',
        subject: values.subject,
        dueDate: values.dueDate,
        priority: values.priority,
      };

      if (editingTask) {
        await taskService.updateTask(editingTask.id, { ...payload, status: values.status });
        notify('Task updated successfully');
      } else {
        await taskService.createTask(payload);
        notify('Task created successfully');
      }

      setIsFormOpen(false);
      setEditingTask(null);
      await load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save the task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    setBusyTaskId(task.id);

    try {
      const next = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await taskService.updateTaskStatus(task.id, next);
      notify(next === 'COMPLETED' ? 'Task marked as completed' : 'Task moved back to pending');
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not update the task', 'error');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setBusyTaskId(taskToDelete.id);

    try {
      await taskService.deleteTask(taskToDelete.id);
      notify('Task deleted');
      setTaskToDelete(null);
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not delete the task', 'error');
    } finally {
      setBusyTaskId(null);
    }
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here is where your coursework stands today.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            setEditingTask(null);
            setFormError(null);
            setIsFormOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Add new task
        </Button>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      {/* Counters */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={summary?.total ?? 0}
          icon={ClipboardList}
          tone="brand"
        />
        <StatCard label="Pending" value={summary?.pending ?? 0} icon={Clock} tone="amber" />
        <StatCard
          label="Completed"
          value={summary?.completed ?? 0}
          icon={CheckCircle2}
          tone="emerald"
          hint={
            summary && summary.total > 0
              ? `${Math.round((summary.completed / summary.total) * 100)}% of all tasks`
              : undefined
          }
        />
        <StatCard
          label="Overdue"
          value={summary?.overdue ?? 0}
          icon={AlertTriangle}
          tone="rose"
          hint={summary?.overdue ? 'Needs attention' : 'Nothing past due'}
        />
      </div>

      {/* Upcoming deadlines */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Upcoming assignments</CardTitle>
            <p className="mt-0.5 text-sm text-slate-500">
              Your five most urgent pending tasks, nearest deadline first.
            </p>
          </div>

          <Link
            to="/tasks"
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            View all tasks
          </Link>
        </CardHeader>

        <CardBody>
          {isLoading ? (
            <SkeletonList rows={3} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck2 className="h-6 w-6" aria-hidden="true" />}
              title="Nothing pending"
              message="You have no outstanding assignments. Add a new task to start tracking one."
              action={
                <Button
                  onClick={() => {
                    setEditingTask(null);
                    setIsFormOpen(true);
                  }}
                  leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                >
                  Add new task
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {upcoming.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isBusy={busyTaskId === task.id}
                  onEdit={(target) => {
                    setEditingTask(target);
                    setFormError(null);
                    setIsFormOpen(true);
                  }}
                  onToggleStatus={handleToggleStatus}
                  onDelete={setTaskToDelete}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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
