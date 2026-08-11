import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCircle2, Pencil, RotateCcw, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AssignedBadge, OverdueBadge, PriorityBadge, StatusBadge } from './TaskBadges';
import { dueLabel, formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onToggleStatus?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  /** Admin task lists show the owner instead of edit/delete controls. */
  showOwner?: boolean;
  isBusy?: boolean;
}

/**
 * The primary task representation.
 *
 * A completed task is distinguished four ways at once - strikethrough title,
 * reduced opacity, a check icon and a "Completed" badge - so the state is
 * unmistakable regardless of how the user perceives colour.
 */
export const TaskCard = ({
  task,
  onEdit,
  onToggleStatus,
  onDelete,
  showOwner = false,
  isBusy = false,
}: TaskCardProps) => {
  const isCompleted = task.status === 'COMPLETED';
  const hasActions = Boolean(onEdit || onToggleStatus || onDelete);

  return (
    <article
      className={cn(
        'group rounded-xl border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover',
        isCompleted ? 'border-slate-200 opacity-75' : 'border-slate-200',
        task.isOverdue && 'border-l-4 border-l-rose-500',
      )}
    >
      <div className="flex items-start gap-3">
        {isCompleted && (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          <Link
            to={`/tasks/${task.id}`}
            className={cn(
              'block truncate text-base font-semibold text-slate-900 hover:text-brand-700 hover:underline',
              isCompleted && 'text-slate-500 line-through',
            )}
          >
            {task.title}
          </Link>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {task.subject}
            </span>

            {showOwner && task.student && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {task.student.name}
                {task.student.studentId && ` (${task.student.studentId})`}
              </span>
            )}
          </div>
        </div>
      </div>

      {task.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
            task.isOverdue
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-slate-200 bg-slate-50 text-slate-600',
          )}
          title={formatDate(task.dueDate)}
        >
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {isCompleted ? `Due ${formatDate(task.dueDate)}` : dueLabel(task.dueDate, task.isOverdue)}
        </span>

        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {task.isOverdue && <OverdueBadge />}
        {task.assignedByAdmin && <AssignedBadge />}
      </div>

      {hasActions && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {onToggleStatus && (
            <Button
              size="sm"
              variant={isCompleted ? 'secondary' : 'success'}
              disabled={isBusy}
              onClick={() => onToggleStatus(task)}
              leftIcon={
                isCompleted ? (
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                )
              }
            >
              {isCompleted ? 'Mark as pending' : 'Mark as completed'}
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              variant="secondary"
              disabled={isBusy}
              onClick={() => onEdit(task)}
              leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isBusy}
              onClick={() => onDelete(task)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
};
