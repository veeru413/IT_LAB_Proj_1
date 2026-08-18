import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ApiRequestError } from '@/services/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Demo accounts, surfaced so the app can be tried immediately. */
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@college.local', password: 'Admin@123' },
  { label: 'Examiner', email: 'examiner@college.local', password: 'Examiner@123' },
  { label: 'Student', email: 'student1@college.local', password: 'Student@123' },
];

export const LoginPage = () => {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);

    try {
      const user = await login(values.email, values.password);
      notify(`Welcome back, ${user.name.split(' ')[0]}`);

      // Return the user where they were heading, or to their home dashboard.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? (user.role === 'STUDENT' ? '/dashboard' : '/admin'), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : 'Login failed. Please try again.',
      );
    }
  };

  /** Fills the form so a demo account is one click away. */
  const useDemoAccount = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setFormError(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Sign in to take the exam or manage the question bank.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field label="Email address" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.local"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Demo credentials
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Seeded development accounts. Click one to fill the form.
        </p>

        <div className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => useDemoAccount(account.email, account.password)}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{account.label}</span>
                <span className="block truncate text-xs text-slate-500">{account.email}</span>
              </span>
              <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {account.password}
              </code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
