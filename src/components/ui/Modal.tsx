import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative bg-white rounded-[20px] p-8 w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.12),0_32px_64px_rgba(124,58,237,0.10)] animate-slide-in-top',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[24px] font-bold text-[var(--color-ink)] tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 rounded-full hover:bg-[var(--color-canvas)] text-[var(--color-ink-muted)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
