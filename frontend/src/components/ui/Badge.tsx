import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  brand: 'border-brand-200 bg-brand-50 text-brand-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Icons carry the meaning too, so status is never colour-only. */
  icon?: ReactNode;
  className?: string;
}

export const Badge = ({ children, tone = 'neutral', icon, className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
      TONES[tone],
      className,
    )}
  >
    {icon}
    {children}
  </span>
);
