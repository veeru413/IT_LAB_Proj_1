import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Centred spinner for full-page and in-panel loading states. */
export const Spinner = ({ className, label = 'Loading' }: { className?: string; label?: string }) => (
  <div role="status" className={cn('flex items-center justify-center py-12', className)}>
    <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

/** Skeleton rows: keeps layout stable while data loads. */
export const SkeletonList = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
    ))}
  </div>
);

interface AlertProps {
  variant?: 'error' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}

const ALERT_STYLES = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export const Alert = ({ variant = 'error', children, className }: AlertProps) => (
  <div
    role="alert"
    className={cn(
      'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
      ALERT_STYLES[variant],
      className,
    )}
  >
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div className="flex-1">{children}</div>
  </div>
);

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/** Shown instead of a blank panel, so the UI always explains itself. */
export const EmptyState = ({ title, message, icon, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
