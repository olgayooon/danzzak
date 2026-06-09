import { cn } from '../../utils/cn';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={cn('w-full h-1.5 bg-[var(--color-hairline)] rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          pct >= 80 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'
        )}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
      />
    </div>
  );
}
