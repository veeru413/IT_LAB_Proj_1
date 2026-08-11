/**
 * Date helpers built on the platform `Intl` API - no date library needed.
 * All formatting is centralised so dates look identical across every screen.
 */

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const shortFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** `15 Aug 2026` */
export const formatDate = (iso: string): string => dateFormatter.format(new Date(iso));

/** `15 Aug` - used where the year is obvious from context. */
export const formatShortDate = (iso: string): string => shortFormatter.format(new Date(iso));

/** `15 Aug 2026, 23:59` */
export const formatDateTime = (iso: string): string => dateTimeFormatter.format(new Date(iso));

/** Converts an ISO timestamp to the `yyyy-mm-dd` a date input expects. */
export const toDateInputValue = (iso: string): string => {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Today as `yyyy-mm-dd`, for the `min` attribute on date inputs. */
export const todayInputValue = (): string => toDateInputValue(new Date().toISOString());

/** Whole days between now and `iso` (negative = in the past). */
export const daysUntil = (iso: string): number => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
};

/**
 * Human-friendly deadline label: "Due today", "Due in 3 days",
 * "2 days overdue". Completed tasks simply report their date.
 */
export const dueLabel = (iso: string, isOverdue: boolean): string => {
  const days = daysUntil(iso);

  if (isOverdue) {
    const late = Math.abs(days);
    if (late === 0) return 'Due today';
    return `${late} day${late === 1 ? '' : 's'} overdue`;
  }

  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 0 && days <= 7) return `Due in ${days} days`;

  return `Due ${formatDate(iso)}`;
};
