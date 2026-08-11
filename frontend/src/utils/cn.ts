import clsx, { type ClassValue } from 'clsx';

/** Conditional class names. Thin wrapper so the import site stays tidy. */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
