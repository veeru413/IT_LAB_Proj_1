import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import * as examService from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/date';
import type { ExamQuestion, ExamSession, QuestionOption } from '@/types';

const OPTION_ORDER: QuestionOption[] = ['A', 'B', 'C', 'D'];

const formatTime = (seconds: number): string => {
  const safe = Math.max(seconds, 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { notify } = useToast();

  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuestionOption>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; totalQuestions: number; percentage: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startedAtRef = useRef<Date>(new Date());
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await examService.getSession();
        if (cancelled) return;

        setSession(data);
        setRemainingSeconds(data.latestAttempt ? 0 : data.exam.durationSeconds);
        startedAtRef.current = new Date();
        setResult(
          data.latestAttempt
            ? {
                score: data.latestAttempt.score,
                totalQuestions: data.latestAttempt.totalQuestions,
                percentage:
                  data.latestAttempt.totalQuestions > 0
                    ? Math.round((data.latestAttempt.score / data.latestAttempt.totalQuestions) * 100)
                    : 0,
              }
            : null,
        );
        setAnswers(data.latestAttempt?.answers ?? {});
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load the exam');
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

  useEffect(() => {
    if (!session || result) return undefined;

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            void handleSubmit();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, result]);

  const totalQuestions = session?.exam.totalQuestions ?? 0;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleOptionChange = (questionId: string, option: QuestionOption) => {
    if (result) return;
    setAnswers((current) => ({ ...current, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!session || result || isSubmitting || totalQuestions === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000),
      );

      const response = await examService.submitExam({
        answers,
        startedAt: startedAtRef.current.toISOString(),
        elapsedSeconds,
      });

      setResult({
        score: response.score,
        totalQuestions: response.totalQuestions,
        percentage: response.percentage,
      });
      notify('Exam submitted successfully', 'success');
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'Could not submit the exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';

  if (isLoading) return <Spinner />;

  if (error || !session) {
    return <Alert>{error ?? 'No exam data available'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Read each question carefully, choose one answer, and submit before the timer ends."
        actions={
          <div className="flex items-center gap-2">
            {result ? (
              <Badge tone="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                Submitted
              </Badge>
            ) : (
              <Badge tone={remainingSeconds <= 60 ? 'danger' : 'brand'} icon={<Clock3 className="h-3.5 w-3.5" />}>
                {formatTime(remainingSeconds)}
              </Badge>
            )}
            <Badge tone="neutral">{answeredCount}/{totalQuestions} answered</Badge>
          </div>
        }
      />

      {submitError && <Alert>{submitError}</Alert>}

      {result && (
        <Alert variant="info">
          Your exam has already been submitted. Only one attempt is allowed, so the question paper is now locked.
        </Alert>
      )}

      {!result && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{session.exam.title}</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                {session.exam.totalQuestions} questions, fixed timer, automatic scoring after submit.
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Started at</p>
              <p className="font-medium text-slate-800">{formatDateTime(startedAtRef.current.toISOString())}</p>
            </div>
          </CardHeader>

          <CardBody className="space-y-5">
            {session.questions.length === 0 ? (
              <EmptyState
                title="No questions available"
                message="Ask the examiner to publish the question bank first."
              />
            ) : (
              session.questions.map((question: ExamQuestion) => (
                <div key={question.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Question {question.position}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">{question.questionText}</h3>
                    </div>
                    <Badge tone="info">{question.subject}</Badge>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {OPTION_ORDER.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:border-brand-300 hover:bg-brand-50"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => handleOptionChange(question.id, option)}
                          className="mt-1 h-4 w-4 text-brand-600"
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Option {option}
                          </span>
                          <span className="block text-sm text-slate-800">{question.options[option]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500">
                The paper is scored automatically. Once submitted, the result appears below.
              </p>
              <Button
                onClick={() => void handleSubmit()}
                isLoading={isSubmitting}
                leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
              >
                Submit exam
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Score</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {result.score}/{result.totalQuestions}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Percentage</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{result.percentage}%</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Submitted
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
