import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.5px]',
        {
          'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]': variant === 'default',
          'bg-[var(--color-success-subtle)] text-[var(--color-success)]': variant === 'success',
          'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]': variant === 'danger',
          'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]': variant === 'warning',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
