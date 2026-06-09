import { cn } from '../../utils/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'utility' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        {
          'bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-hover)] active:scale-95 active:bg-[var(--color-primary-active)]': variant === 'primary',
          'bg-white text-[var(--color-primary)] border-[1.5px] border-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-subtle)]': variant === 'secondary',
          'bg-white text-[var(--color-ink)] border border-[var(--color-hairline)] rounded-[10px] hover:bg-[var(--color-canvas)]': variant === 'utility',
          'bg-[var(--color-danger)] text-white rounded-full hover:opacity-90 active:scale-95': variant === 'danger',
          'text-[var(--color-ink-muted)] rounded-[10px] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]': variant === 'ghost',
        },
        {
          'text-[13px] px-3 py-1.5': size === 'sm',
          'text-[15px] px-5 py-2.5': size === 'md',
          'text-[16px] px-7 py-3': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
