import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + control + error, laid out identically everywhere.
 * Errors are announced with an icon and text, never colour alone.
 */
export const Field = ({ label, htmlFor, error, hint, required, children }: FieldWrapperProps) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
      {label}
      {required && (
        <span className="ml-0.5 text-rose-600" aria-hidden="true">
          *
        </span>
      )}
    </label>

    {children}

    {error ? (
      <p id={`${htmlFor}-error`} className="flex items-center gap-1 text-xs font-medium text-rose-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {error}
      </p>
    ) : (
      hint && <p className="text-xs text-slate-500">{hint}</p>
    )}
  </div>
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${props.id}-error` : undefined}
      className={cn('form-control', hasError && 'form-control-error', className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${props.id}-error` : undefined}
      className={cn('form-control resize-y', hasError && 'form-control-error', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, className, children, ...props }, ref) => (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${props.id}-error` : undefined}
      className={cn('form-control cursor-pointer pr-8', hasError && 'form-control-error', className)}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
