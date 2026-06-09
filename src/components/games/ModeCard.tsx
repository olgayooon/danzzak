import { cn } from '../../utils/cn';

interface ModeCardProps {
  icon: string;
  title: string;
  description: string;
  badge?: string | null;
  onClick: () => void;
  disabled?: boolean;
  dimmed?: boolean;
}

export function ModeCard({ icon, title, description, badge, onClick, disabled, dimmed }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || dimmed}
      className={cn(
        'w-full p-3 rounded-lg border transition-all text-left',
        !disabled && !dimmed
          ? 'border-[var(--color-hairline)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] cursor-pointer'
          : 'border-[var(--color-hairline)] bg-[var(--color-surface)] cursor-not-allowed',
        (disabled || dimmed) && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xl shrink-0">{icon}</span>
        {badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-warning)] text-white whitespace-nowrap">
            {badge}
          </span>
        )}
        {disabled && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-hairline)] text-[var(--color-ink-faint)] whitespace-nowrap">
            준비 중
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-[var(--color-ink)] mb-0.5">{title}</p>
      <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1">{description}</p>
    </button>
  );
}
