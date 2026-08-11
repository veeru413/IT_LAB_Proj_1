import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { OverdueBadge, PriorityBadge, StatusBadge } from '@/components/tasks/TaskBadges';
import { PageHeader } from '@/components/ui/PageHeader';
import * as adminService from '@/services/admin.service';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { AdminDashboardData } from '@/types';

/** Slim progress meter used in the student progress table. */
const ProgressBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
      <div
        className={cn(
          'h-full rounded-full',
          value >= 75 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-rose-500',
        )}
        style={{ width: `${Math.max(value, 2)}%` }}
      />
    </div>
    <span className="text-xs tabular-nums text-slate-600">{value}%</span>
  </div>
);

/** `/admin` - class-wide overview for the professor. */
export const AdminDashboardPage = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await adminService.getStatistics();
        if (!cancelled) setData(result);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load admin statistics');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <Spinner />;

  if (error || !data) {
    return <Alert>{error ?? 'No data available'}</Alert>;
  }

  const { statistics, recentTasks, studentProgress } = data;

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Class-wide view of students, assignments and progress."
        actions={
          <Link to="/admin/tasks/create">
            <Button leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden="true" />}>
              Create assignment
            </Button>
          </Link>
        }
      />

      {/* Headline statistics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total students" value={statistics.totalStudents} icon={Users} tone="brand" />
        <StatCard
          label="Total assignments"
          value={statistics.totalAssignments}
          icon={ClipboardList}
          tone="slate"
        />
        <StatCard label="Pending" value={statistics.pendingAssignments} icon={Clock} tone="amber" />
        <StatCard
          label="Completed"
          value={statistics.completedAssignments}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${statistics.completionRate}% completion rate`}
        />
        <StatCard
          label="Overdue"
          value={statistics.overdueAssignments}
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent assignments</CardTitle>
            <Link
              to="/admin/tasks"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>

          <CardBody className="p-0">
            {recentTasks.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No assignments yet"
                  message="Create the first assignment to get started."
                  action={
                    <Link to="/admin/tasks/create">
                      <Button>Create assignment</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th scope="col" className="table-header">Assignment</th>
                      <th scope="col" className="table-header">Subject</th>
                      <th scope="col" className="table-header">Assigned to</th>
                      <th scope="col" className="table-header">Due date</th>
                      <th scope="col" className="table-header">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentTasks.map((task) => (
                      <tr key={task.id} className="transition-colors hover:bg-slate-50">
                        <td className="table-cell font-medium text-slate-900">
                          <span className="line-clamp-1">{task.title}</span>
                        </td>
                        <td className="table-cell">{task.subject}</td>
                        <td className="table-cell">
                          <span className="line-clamp-1">{task.student?.name ?? '-'}</span>
                        </td>
                        <td className="table-cell whitespace-nowrap">{formatDate(task.dueDate)}</td>
                        <td className="table-cell">
                          {task.isOverdue ? <OverdueBadge /> : <StatusBadge status={task.status} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Student progress */}
        <Card>
          <CardHeader>
            <CardTitle>Student progress</CardTitle>
            <Link
              to="/admin/students"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>

          <CardBody className="p-0">
            {studentProgress.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No students yet" message="Registered students will appear here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th scope="col" className="table-header">Student</th>
                      <th scope="col" className="table-header">Total</th>
                      <th scope="col" className="table-header">Completed</th>
                      <th scope="col" className="table-header">Pending</th>
                      <th scope="col" className="table-header">Overdue</th>
                      <th scope="col" className="table-header">Progress</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {studentProgress.map((student) => (
                      <tr key={student.id} className="transition-colors hover:bg-slate-50">
                        <td className="table-cell">
                          <Link
                            to={`/admin/students/${student.id}`}
                            className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                          >
                            {student.name}
                          </Link>
                          <span className="block text-xs text-slate-500">{student.studentId}</span>
                        </td>
                        <td className="table-cell tabular-nums">{student.totalTasks}</td>
                        <td className="table-cell tabular-nums text-emerald-700">
                          {student.completedTasks}
                        </td>
                        <td className="table-cell tabular-nums text-amber-700">
                          {student.pendingTasks}
                        </td>
                        <td className="table-cell tabular-nums">
                          {student.overdueTasks > 0 ? (
                            <span className="font-medium text-rose-600">{student.overdueTasks}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <ProgressBar value={student.completionRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Priority legend so the table badges are self-explanatory in a demo. */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Priority key
        </span>
        <PriorityBadge priority="HIGH" />
        <PriorityBadge priority="MEDIUM" />
        <PriorityBadge priority="LOW" />
      </div>
    </div>
  );
};
