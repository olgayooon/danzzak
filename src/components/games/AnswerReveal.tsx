import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface AnswerRevealProps {
  term: string;
  definition: string;
  /** true → 표시. false → 0.3초 페이드아웃 후 unmount */
  visible: boolean;
  /** 표시 위치: 'top' = fixed 상단, 'inline' = 인라인 흐름 */
  position?: 'top' | 'inline';
}

/**
 * 오답 후 정답을 보여주는 논블로킹 컴포넌트.
 * 게임 플로우를 막지 않으며, visible=false 시 fade-out 후 자동 unmount.
 */
export function AnswerReveal({ term, definition, visible, position = 'inline' }: AnswerRevealProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'rounded-[10px] px-3 py-2 text-[13px] font-semibold transition-all duration-300',
        'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
        position === 'top'
          ? 'fixed top-[68px] left-1/2 -translate-x-1/2 z-50 shadow-md'
          : 'mt-2 text-center',
      )}
      role="status"
      aria-live="polite"
    >
      정답:{' '}
      <span className="font-bold">{term}</span>
      {definition && (
        <span className="opacity-75"> = {definition}</span>
      )}
    </div>
  );
}
