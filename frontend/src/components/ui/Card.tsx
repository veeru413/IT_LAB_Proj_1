import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a lift on hover - only for cards that are themselves clickable. */
  interactive?: boolean;
}

/** Surface primitive: white panel, subtle border, restrained shadow. */
export const Card = ({ children, className, interactive = false, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200 bg-white shadow-card',
      interactive && 'transition-shadow hover:shadow-card-hover',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-base font-semibold text-slate-900', className)} {...props}>
    {children}
  </h2>
);

export const CardBody = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);
