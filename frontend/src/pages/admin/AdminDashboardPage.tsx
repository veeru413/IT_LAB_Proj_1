import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Edit3, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import * as examService from '@/services/exam.service';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/date';
import type { ExamDashboardData, ExamQuestion, ExamQuestionPayload, QuestionOption } from '@/types';

const questionSchema = z.object({
  questionText: z.string().trim().min(5, 'Question text is required').max(300),
  optionA: z.string().trim().min(1, 'Option A is required').max(200),
  optionB: z.string().trim().min(1, 'Option B is required').max(200),
  optionC: z.string().trim().min(1, 'Option C is required').max(200),
  optionD: z.string().trim().min(1, 'Option D is required').max(200),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().trim().optional().default(''),
  subject: z.string().trim().min(2, 'Subject is required').max(80),
  position: z.coerce.number().int().min(1).max(10),
  isActive: z.enum(['true', 'false']),
});

type QuestionValues = z.infer<typeof questionSchema>;

const INITIAL_VALUES: QuestionValues = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  explanation: '',
  subject: '',
  position: 1,
  isActive: 'true',
};

export const AdminDashboardPage = () => {
  const { notify } = useToast();
  const [data, setData] = useState<ExamDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestion | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: INITIAL_VALUES,
  });

  const load = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await examService.getAdminDashboard();
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load the exam dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (editingQuestion) {
      reset({
        questionText: editingQuestion.questionText,
        optionA: editingQuestion.options.A,
        optionB: editingQuestion.options.B,
        optionC: editingQuestion.options.C,
        optionD: editingQuestion.options.D,
        correctOption: (editingQuestion.correctOption ?? 'A') as QuestionOption,
        explanation: editingQuestion.explanation ?? '',
        subject: editingQuestion.subject,
        position: editingQuestion.position,
        isActive: editingQuestion.isActive ? 'true' : 'false',
      });
    } else {
      reset(INITIAL_VALUES);
    }
  }, [editingQuestion, reset]);

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingQuestion(null);
    setFormError(null);
  };

  const openCreateEditor = () => {
    const usedPositions = new Set((data?.questions ?? []).map((question) => question.position));
    const nextPosition = Array.from({ length: 10 }, (_, index) => index + 1).find(
      (position) => !usedPositions.has(position),
    );

    if (!nextPosition) {
      notify('The exam already has 10 questions. Edit or delete one before adding another.', 'info');
      return;
    }

    setEditingQuestion(null);
    reset({ ...INITIAL_VALUES, position: nextPosition });
    setFormError(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setFormError(null);
    setIsEditorOpen(true);
  };

  const submitQuestion = async (values: QuestionValues) => {
    const payload: ExamQuestionPayload = {
      questionText: values.questionText,
      optionA: values.optionA,
      optionB: values.optionB,
      optionC: values.optionC,
      optionD: values.optionD,
      correctOption: values.correctOption,
      explanation: values.explanation ?? '',
      subject: values.subject,
      position: values.position,
      isActive: values.isActive === 'true',
    };

    try {
      if (editingQuestion) {
        await examService.updateQuestion(editingQuestion.id, payload);
        notify('Question updated successfully');
      } else {
        await examService.createQuestion(payload);
        notify('Question added successfully');
      }

      setIsEditorOpen(false);
      setEditingQuestion(null);
      setFormError(null);
      await load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save the question');
    }
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      await examService.deleteQuestion(questionToDelete.id);
      notify('Question deleted successfully');
      setQuestionToDelete(null);
      await load();
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Could not delete the question', 'error');
    }
  };

  if (isLoading) return <Spinner />;

  if (error || !data) {
    return <Alert>{error ?? 'No dashboard data available'}</Alert>;
  }

  const { statistics, questions, attempts } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam dashboard"
        description="Manage the 10-question paper, watch results come in, and keep the exam simple."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateEditor}>
            Add question
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardBody className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Students</p>
              <p className="text-2xl font-semibold text-slate-900">{statistics.totalStudents}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-slate-600" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Examiners</p>
              <p className="text-2xl font-semibold text-slate-900">{statistics.totalExaminers}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Questions</p>
              <p className="text-2xl font-semibold text-slate-900">{statistics.totalQuestions}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Attempts</p>
              <p className="text-2xl font-semibold text-slate-900">{statistics.totalAttempts}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-slate-900">{statistics.averageScore}%</span>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Average score</p>
              <p className="text-sm text-slate-500">Across submitted attempts</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Question bank</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                message="Add the first MCQ to build the paper."
                action={<Button onClick={openCreateEditor}>Add question</Button>}
              />
            ) : (
              questions.map((question) => (
                <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Question {question.position}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900">{question.questionText}</h3>
                      <p className="mt-1 text-xs text-slate-500">{question.subject}</p>
                    </div>
                    <Badge tone={question.isActive ? 'success' : 'neutral'}>
                      {question.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                        <span className="mr-2 font-semibold text-slate-500">{key}.</span>
                        {value}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Correct answer: <span className="font-medium text-slate-700">{question.correctOption}</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Edit3 className="h-4 w-4" />}
                        onClick={() => openEditEditor(question)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => setQuestionToDelete(question)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {attempts.length === 0 ? (
              <EmptyState title="No attempts yet" message="Student results will appear here after submission." />
            ) : (
              attempts.slice(0, 8).map((attempt) => (
                <div key={attempt.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{attempt.user?.name ?? 'Student'}</p>
                      <p className="text-xs text-slate-500">{attempt.user?.studentId ?? attempt.user?.email ?? ''}</p>
                    </div>
                    <Badge tone="brand">{attempt.score}/{attempt.totalQuestions}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Submitted {formatDateTime(attempt.submittedAt)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={editingQuestion ? 'Edit question' : 'Add question'}
        description="Keep it short and clear. The exam uses four options and one correct answer."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" form="question-form" isLoading={isSubmitting}>
              Save question
            </Button>
          </>
        }
      >
        <form id="question-form" onSubmit={handleSubmit(submitQuestion)} className="space-y-4" noValidate>
          {formError && <Alert>{formError}</Alert>}

          <Field label="Question text" htmlFor="questionText" required error={errors.questionText?.message}>
            <Textarea id="questionText" rows={3} hasError={Boolean(errors.questionText)} {...register('questionText')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="subject" required error={errors.subject?.message}>
              <Input id="subject" hasError={Boolean(errors.subject)} {...register('subject')} />
            </Field>

            <Field label="Position" htmlFor="position" required error={errors.position?.message}>
              <Input id="position" type="number" min={1} max={10} hasError={Boolean(errors.position)} {...register('position', { valueAsNumber: true })} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Option A" htmlFor="optionA" required error={errors.optionA?.message}>
              <Input id="optionA" hasError={Boolean(errors.optionA)} {...register('optionA')} />
            </Field>
            <Field label="Option B" htmlFor="optionB" required error={errors.optionB?.message}>
              <Input id="optionB" hasError={Boolean(errors.optionB)} {...register('optionB')} />
            </Field>
            <Field label="Option C" htmlFor="optionC" required error={errors.optionC?.message}>
              <Input id="optionC" hasError={Boolean(errors.optionC)} {...register('optionC')} />
            </Field>
            <Field label="Option D" htmlFor="optionD" required error={errors.optionD?.message}>
              <Input id="optionD" hasError={Boolean(errors.optionD)} {...register('optionD')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correct option" htmlFor="correctOption" required error={errors.correctOption?.message}>
              <Select id="correctOption" hasError={Boolean(errors.correctOption)} {...register('correctOption')}>
                {(['A', 'B', 'C', 'D'] as QuestionOption[]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="isActive" error={errors.isActive?.message}>
              <Select id="isActive" hasError={Boolean(errors.isActive)} {...register('isActive')}>
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </Select>
            </Field>
          </div>

          <Field label="Explanation" htmlFor="explanation" error={errors.explanation?.message}>
            <Textarea id="explanation" rows={3} hasError={Boolean(errors.explanation)} {...register('explanation')} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={questionToDelete !== null}
        title="Delete question"
        message={`Delete "${questionToDelete?.questionText}"? This removes it from the exam paper.`}
        isLoading={false}
        onConfirm={confirmDelete}
        onCancel={() => setQuestionToDelete(null)}
      />
    </div>
  );
};
