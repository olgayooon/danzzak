import { cn } from '../../utils/cn';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[14px] font-semibold text-[var(--color-ink-secondary)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-hairline)] rounded-[10px] px-3.5 py-2.5 text-[16px] outline-none transition-all duration-150',
          'placeholder:text-[var(--color-ink-faint)]',
          'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]',
          error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_var(--color-danger-subtle)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-[13px] text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
