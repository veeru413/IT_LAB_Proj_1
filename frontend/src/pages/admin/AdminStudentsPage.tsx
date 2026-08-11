import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import * as adminService from '@/services/admin.service';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';
import type { StudentWithStats } from '@/types';

/** `/admin/students` - every registered student with their task counters. */
export const AdminStudentsPage = () => {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setStudents(await adminService.listStudents(debouncedSearch || undefined));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Students"
        description="All registered students and how much of their coursework is complete."
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or student ID..."
            aria-label="Search students"
            className="form-control pl-9"
          />
        </div>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      {isLoading ? (
        <Spinner />
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title={search ? 'No matching students' : 'No students registered'}
          message={
            search
              ? 'Try a different search term.'
              : 'Students who create an account will appear here.'
          }
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th scope="col" className="table-header">Student name</th>
                    <th scope="col" className="table-header">Student ID</th>
                    <th scope="col" className="table-header">Email</th>
                    <th scope="col" className="table-header">Tasks</th>
                    <th scope="col" className="table-header">Completed</th>
                    <th scope="col" className="table-header">Pending</th>
                    <th scope="col" className="table-header">Overdue</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-slate-50">
                      <td className="table-cell">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                        >
                          {student.name}
                        </Link>
                      </td>

                      <td className="table-cell">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                          {student.studentId}
                        </code>
                      </td>

                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          {student.email}
                        </span>
                      </td>

                      <td className="table-cell font-medium tabular-nums">{student.totalTasks}</td>
                      <td className="table-cell tabular-nums text-emerald-700">
                        {student.completedTasks}
                      </td>
                      <td className="table-cell tabular-nums text-amber-700">
                        {student.pendingTasks}
                      </td>
                      <td className="table-cell tabular-nums">
                        <span
                          className={cn(
                            student.overdueTasks > 0 ? 'font-medium text-rose-600' : 'text-slate-400',
                          )}
                        >
                          {student.overdueTasks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
