import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardList, Clock } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Badge } from '@/components/ui/Badge';
import * as adminService from '@/services/admin.service';
import type { StudentWithStats, Task } from '@/types';

/** `/admin/students/:id` - one student's profile and full task list. */
export const AdminStudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<StudentWithStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await adminService.getStudent(id);
        if (!cancelled) {
          setStudent(data.student);
          setTasks(data.tasks);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load this student');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <Spinner />;

  if (error || !student) {
    return (
      <div>
        <Alert className="mb-4">{error ?? 'Student not found'}</Alert>
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to students
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/students"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to students
      </Link>

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-semibold text-brand-700">
              {student.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                {student.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-slate-500">{student.email}</p>
            </div>
          </div>

          <Badge tone="neutral">{student.studentId}</Badge>
        </CardBody>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={student.totalTasks} icon={ClipboardList} tone="brand" />
        <StatCard label="Pending" value={student.pendingTasks} icon={Clock} tone="amber" />
        <StatCard
          label="Completed"
          value={student.completedTasks}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${student.completionRate}% completion rate`}
        />
        <StatCard label="Overdue" value={student.overdueTasks} icon={AlertTriangle} tone="rose" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All tasks ({tasks.length})</CardTitle>
        </CardHeader>

        <CardBody>
          {tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              message="This student has not been assigned any work, and has not created any of their own."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {/* Read-only: an admin oversees work but does not edit it here. */}
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
