import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export type StatTone = 'brand' | 'amber' | 'emerald' | 'rose' | 'slate';

const TONES: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
}

/** A single headline number. Used by both dashboards for a consistent look. */
export const StatCard = ({ label, value, icon: Icon, tone = 'slate', hint }: StatCardProps) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
          {value}
        </p>
        {hint && <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>}
      </div>

      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
    </div>
  </div>
);
