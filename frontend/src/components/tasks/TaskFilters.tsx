import { ArrowDownAZ, ArrowUpAZ, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { cn } from '@/utils/cn';
import { PRIORITY_OPTIONS, SORT_OPTIONS } from '@/utils/task';
import type { Priority, SortOrder, TaskQueryParams, TaskSortField, TaskStatus } from '@/types';

export interface FilterState {
  search: string;
  status: TaskStatus | 'ALL';
  priority: Priority | 'ALL';
  subject: string;
  sortBy: TaskSortField;
  order: SortOrder;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  subject: '',
  sortBy: 'dueDate',
  order: 'asc',
};

/** Converts UI filter state into the query the API expects. */
export const toQueryParams = (filters: FilterState): TaskQueryParams => ({
  ...(filters.search && { search: filters.search }),
  ...(filters.status !== 'ALL' && { status: filters.status }),
  ...(filters.priority !== 'ALL' && { priority: filters.priority }),
  ...(filters.subject && { subject: filters.subject }),
  sortBy: filters.sortBy,
  order: filters.order,
});

export const hasActiveFilters = (filters: FilterState): boolean =>
  filters.search !== '' ||
  filters.status !== 'ALL' ||
  filters.priority !== 'ALL' ||
  filters.subject !== '';

interface TaskFiltersProps {
  filters: FilterState;
  subjects: string[];
  onChange: (filters: FilterState) => void;
  /** Extra control slot - the admin page injects its student filter here. */
  children?: React.ReactNode;
}

const STATUS_TABS: Array<{ value: TaskStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
];

/**
 * Search + filter + sort toolbar.
 *
 * Status is a segmented control because it is the filter users change most;
 * the rest stay as compact dropdowns so the toolbar does not dominate the page.
 */
export const TaskFilters = ({ filters, subjects, onChange, children }: TaskFiltersProps) => {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => update('search', event.target.value)}
            placeholder="Search by title, subject or description..."
            aria-label="Search tasks"
            className="form-control pl-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update('search', '')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Status segmented control */}
        <div
          role="group"
          aria-label="Filter by status"
          className="flex rounded-lg border border-slate-300 bg-slate-50 p-0.5"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => update('status', tab.value)}
              aria-pressed={filters.status === tab.value}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filters.status === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-[140px] flex-1 sm:flex-none">
          <label htmlFor="filter-priority" className="mb-1 block text-xs font-medium text-slate-500">
            Priority
          </label>
          <Select
            id="filter-priority"
            value={filters.priority}
            onChange={(event) => update('priority', event.target.value as Priority | 'ALL')}
          >
            <option value="ALL">All priorities</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="min-w-[160px] flex-1 sm:flex-none">
          <label htmlFor="filter-subject" className="mb-1 block text-xs font-medium text-slate-500">
            Subject
          </label>
          <Select
            id="filter-subject"
            value={filters.subject}
            onChange={(event) => update('subject', event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </div>

        {children}

        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-slate-500">
            Sort by
          </label>
          <Select
            id="filter-sort"
            value={filters.sortBy}
            onChange={(event) => update('sortBy', event.target.value as TaskSortField)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Button
          variant="secondary"
          onClick={() => update('order', filters.order === 'asc' ? 'desc' : 'asc')}
          aria-label={`Sort ${filters.order === 'asc' ? 'descending' : 'ascending'}`}
          title={filters.order === 'asc' ? 'Ascending' : 'Descending'}
          leftIcon={
            filters.order === 'asc' ? (
              <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
            )
          }
        >
          {filters.order === 'asc' ? 'Ascending' : 'Descending'}
        </Button>

        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            onClick={() => onChange({ ...DEFAULT_FILTERS, sortBy: filters.sortBy, order: filters.order })}
            leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};
