import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { taskFormSchema, type TaskFormValues } from './taskFormSchema';
import { todayInputValue, toDateInputValue } from '@/utils/date';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/utils/task';
import type { Task } from '@/types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  /** Present when editing; absent when creating. */
  task?: Task | null;
  /** Field errors returned by the API, merged into the form. */
  serverError?: string | null;
}

const emptyValues: TaskFormValues = {
  title: '',
  description: '',
  subject: '',
  dueDate: todayInputValue(),
  priority: 'MEDIUM',
};

/** Create/edit form. One component serves both modes to avoid duplication. */
export const TaskFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  serverError,
}: TaskFormModalProps) => {
  const isEditing = Boolean(task);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: emptyValues,
  });

  // Repopulate whenever the dialog opens or the target task changes.
  useEffect(() => {
    if (!isOpen) return;

    reset(
      task
        ? {
            title: task.title,
            description: task.description,
            subject: task.subject,
            dueDate: toDateInputValue(task.dueDate),
            priority: task.priority,
            status: task.status,
          }
        : emptyValues,
    );
  }, [isOpen, task, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit task' : 'Add new task'}
      description={
        isEditing ? 'Update the details of this assignment.' : 'Track a new assignment or to-do.'
      }
    >
      <form
        id="task-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {serverError && <Alert>{serverError}</Alert>}

        <Field label="Title" htmlFor="title" required error={errors.title?.message}>
          <Input
            id="title"
            placeholder="e.g. Data Structures Assignment 3"
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
          hint="Optional - what exactly needs to be done?"
        >
          <Textarea
            id="description"
            rows={3}
            placeholder="Implement AVL tree insertion and deletion, include complexity analysis..."
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

        {isEditing && (
          <Field label="Status" htmlFor="status" error={errors.status?.message}>
            <Select id="status" hasError={Boolean(errors.status)} {...register('status')}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
