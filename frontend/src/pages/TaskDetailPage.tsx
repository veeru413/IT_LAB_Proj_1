import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Pencil,
  RotateCcw,
  Trash2,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/tasks/TaskBadges';
import type { TaskFormValues } from '@/components/tasks/taskFormSchema';
import * as taskService from '@/services/task.service';
import { useToast } from '@/hooks/useToast';
import { dueLabel, formatDate, formatDateTime } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';

/** Read-only metadata row used in the detail sidebar. */
const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  </div>
);

/** `/tasks/:id` - the full record for a single assignment. */
export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      setTask(await taskService.getTask(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load this task');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleStatus = async () => {
    if (!task) return;
    setIsBusy(true);

    try {
      const next = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      setTask(await taskService.updateTaskStatus(task.id, next));
      notify(next === 'COMPLETED' ? 'Task marked as completed' : 'Task moved back to pending');
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not update the task', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmit = async (values: TaskFormValues) => {
    if (!task) return;
    setFormError(null);

    try {
      setTask(
        await taskService.updateTask(task.id, {
          title: values.title,
          description: values.description ?? '',
          subject: values.subject,
          dueDate: values.dueDate,
          priority: values.priority,
          status: values.status,
        }),
      );
      notify('Task updated successfully');
      setIsFormOpen(false);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save the task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsBusy(true);

    try {
      await taskService.deleteTask(task.id);
      notify('Task deleted');
      navigate('/tasks', { replace: true });
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not delete the task', 'error');
      setIsBusy(false);
      setIsConfirmOpen(false);
    }
  };

  if (isLoading) return <Spinner />;

  if (error || !task) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert className="mb-4">{error ?? 'Task not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/tasks')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to tasks
        </Button>
      </div>
    );
  }

  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/tasks"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <Card>
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              )}
              <CardTitle
                className={cn('text-lg', isCompleted && 'text-slate-500 line-through')}
              >
                {task.title}
              </CardTitle>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.isOverdue && <OverdueBadge />}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant={isCompleted ? 'secondary' : 'success'}
              disabled={isBusy}
              onClick={handleToggleStatus}
              leftIcon={
                isCompleted ? (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )
              }
            >
              {isCompleted ? 'Mark as pending' : 'Mark as completed'}
            </Button>

            <Button
              variant="secondary"
              disabled={isBusy}
              onClick={() => {
                setFormError(null);
                setIsFormOpen(true);
              }}
              leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            >
              Edit
            </Button>

            <Button
              variant="ghost"
              disabled={isBusy}
              onClick={() => setIsConfirmOpen(true)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            >
              Delete
            </Button>
          </div>
        </CardHeader>

        <CardBody className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {task.description || 'No description was added for this task.'}
            </p>
          </div>

          <dl className="divide-y divide-slate-100 md:border-l md:border-slate-100 md:pl-6">
            <DetailRow icon={BookOpen} label="Subject">
              {task.subject}
            </DetailRow>

            <DetailRow icon={CalendarDays} label="Due date">
              <span className={cn(task.isOverdue && 'font-medium text-rose-600')}>
                {formatDate(task.dueDate)}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {dueLabel(task.dueDate, task.isOverdue)}
              </span>
            </DetailRow>

            {task.assignedByAdmin && (
              <DetailRow icon={UserCog} label="Assigned by">
                {task.creator?.name ?? 'Faculty'}
              </DetailRow>
            )}

            <DetailRow icon={Clock} label="Created">
              {formatDateTime(task.createdAt)}
            </DetailRow>

            <DetailRow icon={Clock} label="Last updated">
              {formatDateTime(task.updatedAt)}
            </DetailRow>
          </dl>
        </CardBody>
      </Card>

      <TaskFormModal
        isOpen={isFormOpen}
        task={task}
        serverError={formError}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        isLoading={isBusy}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
