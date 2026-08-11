import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ApiRequestError } from '@/services/api';

/**
 * Mirrors the server-side registration schema so mistakes surface before a
 * round trip. The server re-validates everything regardless.
 */
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters long'),
    studentId: z
      .string()
      .trim()
      .min(2, 'Student ID is required')
      .regex(/^[A-Za-z0-9._/-]+$/, 'Student ID may only contain letters, numbers, . _ - /'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { register: registerAccount } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      studentId: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);

    try {
      const user = await registerAccount(values);
      notify(`Account created. Welcome, ${user.name.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        // Map field-level errors from the API back onto the form controls.
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            if (field in values) {
              setError(field as keyof RegisterValues, { type: 'server', message });
            }
          });
        }

        // A 409 means email or student ID is already taken.
        if (error.status === 409) {
          const field = /student id/i.test(error.message) ? 'studentId' : 'email';
          setError(field, { type: 'server', message: error.message });
        }

        setFormError(error.message);
        return;
      }

      setFormError('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Register as a student to start tracking your assignments.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Veerendra Patil"
            hasError={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field
          label="Student ID"
          htmlFor="studentId"
          required
          error={errors.studentId?.message}
          hint="Your college roll number, e.g. CS21B045"
        >
          <Input
            id="studentId"
            placeholder="CS21B045"
            hasError={Boolean(errors.studentId)}
            {...register('studentId')}
          />
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          required
          error={errors.password?.message}
          hint="At least 8 characters, including a letter and a number."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            hasError={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
        </Field>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};
