import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Circle, Minus, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Priority, TaskStatus } from '@/types';

/**
 * Status and priority indicators.
 *
 * Each badge pairs a colour with an icon *and* a text label, so meaning never
 * depends on colour perception alone.
 */

const PRIORITY_CONFIG = {
  HIGH: { tone: 'danger', label: 'High', Icon: ArrowUp },
  MEDIUM: { tone: 'warning', label: 'Medium', Icon: Minus },
  LOW: { tone: 'info', label: 'Low', Icon: ArrowDown },
} as const;

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const { tone, label, Icon } = PRIORITY_CONFIG[priority];

  return (
    <Badge tone={tone} icon={<Icon className="h-3 w-3" aria-hidden="true" />}>
      {label} priority
    </Badge>
  );
};

export const StatusBadge = ({ status }: { status: TaskStatus }) =>
  status === 'COMPLETED' ? (
    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" aria-hidden="true" />}>
      Completed
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<Circle className="h-3 w-3" aria-hidden="true" />}>
      Pending
    </Badge>
  );

/** Only rendered for tasks the API flagged as overdue. */
export const OverdueBadge = () => (
  <Badge tone="danger" icon={<AlertTriangle className="h-3 w-3" aria-hidden="true" />}>
    Overdue
  </Badge>
);

/** Marks work the professor assigned, as opposed to a personal to-do. */
export const AssignedBadge = () => (
  <Badge tone="brand" icon={<UserCog className="h-3 w-3" aria-hidden="true" />}>
    Assigned
  </Badge>
);
