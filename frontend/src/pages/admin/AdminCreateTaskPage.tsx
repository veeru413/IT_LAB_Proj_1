import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, FilePlus2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, Spinner } from '@/components/ui/Feedback';
import * as adminService from '@/services/admin.service';
import { useToast } from '@/hooks/useToast';
import { todayInputValue } from '@/utils/date';
import { PRIORITY_OPTIONS } from '@/utils/task';
import { cn } from '@/utils/cn';
import type { StudentWithStats } from '@/types';

const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters long').max(120),
  description: z.string().trim().max(2000, 'Description is too long').optional(),
  subject: z.string().trim().min(2, 'Subject must be at least 2 characters long').max(60),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

type AssignmentValues = z.infer<typeof assignmentSchema>;

type Audience = 'ALL' | 'SELECTED';

/**
 * `/admin/tasks/create`
 *
 * Choosing "All students" makes the API create one task row per student, so
 * every student owns their own copy of the assignment.
 */
export const AdminCreateTaskPage = () => {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [audience, setAudience] = useState<Audience>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      dueDate: todayInputValue(),
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    let cancelled = false;

    adminService
      .listStudents()
      .then((result) => {
        if (!cancelled) setStudents(result);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setFormError(caught instanceof Error ? caught.message : 'Failed to load students');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStudents(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleStudent = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const onSubmit = async (values: AssignmentValues) => {
    setFormError(null);

    if (audience === 'SELECTED' && selectedIds.length === 0) {
      setFormError('Select at least one student, or choose "All students".');
      return;
    }

    try {
      const result = await adminService.createAssignment({
        title: values.title,
        description: values.description ?? '',
        subject: values.subject,
        dueDate: values.dueDate,
        priority: values.priority,
        assignTo: audience === 'ALL' ? 'ALL' : selectedIds,
      });

      notify(
        `Assignment created for ${result.created} student${result.created === 1 ? '' : 's'}`,
      );
      navigate('/admin/tasks');
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not create the assignment');
    }
  };

  const targetCount = audience === 'ALL' ? students.length : selectedIds.length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Create assignment"
        description="Hand out an assignment to one student or to the entire class."
      />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {formError && <Alert>{formError}</Alert>}

            <Field label="Assignment title" htmlFor="title" required error={errors.title?.message}>
              <Input
                id="title"
                placeholder="e.g. Data Structures Assignment 4"
                hasError={Boolean(errors.title)}
                {...register('title')}
              />
            </Field>

            <Field label="Subject" htmlFor="subject" required error={errors.subject?.message}>
              <Input
                id="subject"
                placeholder="e.g. Data Structures"
                hasError={Boolean(errors.subject)}
                {...register('subject')}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="description"
              error={errors.description?.message}
              hint="Explain what students need to submit."
            >
              <Textarea
                id="description"
                rows={4}
                placeholder="Implement an AVL tree with insertion and deletion. Include complexity analysis and test output."
                hasError={Boolean(errors.description)}
                {...register('description')}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Due date" htmlFor="dueDate" required error={errors.dueDate?.message}>
                <Input
                  id="dueDate"
                  type="date"
                  hasError={Boolean(errors.dueDate)}
                  {...register('dueDate')}
                />
              </Field>

              <Field label="Priority" htmlFor="priority" required error={errors.priority?.message}>
                <Select id="priority" hasError={Boolean(errors.priority)} {...register('priority')}>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Audience selection */}
            <fieldset className="border-t border-slate-200 pt-5">
              <legend className="sr-only">Assign to</legend>
              <p className="mb-3 text-sm font-medium text-slate-700">
                Assign to
                <span className="ml-0.5 text-rose-600" aria-hidden="true">
                  *
                </span>
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAudience('ALL')}
                  aria-pressed={audience === 'ALL'}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    audience === 'ALL'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  )}
                >
                  <Users
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      audience === 'ALL' ? 'text-brand-600' : 'text-slate-400',
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">All students</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Creates a separate task for each of the {students.length} registered students.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudience('SELECTED')}
                  aria-pressed={audience === 'SELECTED'}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    audience === 'SELECTED'
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-slate-300 bg-white hover:border-slate-400',
                  )}
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      audience === 'SELECTED' ? 'text-brand-600' : 'text-slate-400',
                    )}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      Specific students
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Pick exactly who receives this assignment.
                    </span>
                  </span>
                </button>
              </div>

              {audience === 'SELECTED' && (
                <div className="mt-4 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Select students ({selectedIds.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.length === students.length
                            ? []
                            : students.map((student) => student.id),
                        )
                      }
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      {selectedIds.length === students.length ? 'Clear all' : 'Select all'}
                    </button>
                  </div>

                  {isLoadingStudents ? (
                    <Spinner className="py-6" />
                  ) : students.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">
                      No students are registered yet.
                    </p>
                  ) : (
                    <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                      {students.map((student) => (
                        <li key={student.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-900">
                                {student.name}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {student.studentId} · {student.email}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </fieldset>

            <div className="flex flex-col-reverse items-center gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-500">
                {targetCount === 0
                  ? 'No students selected yet.'
                  : `This will create ${targetCount} task${targetCount === 1 ? '' : 's'}.`}
              </p>

              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/tasks')}
                  disabled={isSubmitting}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  fullWidth
                  leftIcon={<FilePlus2 className="h-4 w-4" aria-hidden="true" />}
                >
                  Create assignment
                </Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
