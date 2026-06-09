import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface FallingInputProps {
  onSubmit: (value: string) => void;
  /**
   * 오답 발생 시 부모가 증가시키는 카운터.
   * 값이 바뀌면 흔들림 애니메이션을 트리거하고 입력창을 초기화.
   * React state이지만 FallingCard와 완전히 분리된 트리에 있으므로
   * 이 리렌더링이 FallingCard에 전달되지 않음.
   */
  wrongKey: number;
  theme: { primary: string };
  disabled?: boolean;
}

/**
 * 낙하 게임 전용 텍스트 입력 컴포넌트.
 * - FallingCard와 완전히 다른 컴포넌트 트리 → 입력 시 FallingCard 리렌더 없음
 * - 오답 시 흔들림 애니메이션 + 입력 초기화
 * - React.memo로 wrongKey·disabled가 바뀔 때만 리렌더링
 */
export const FallingInput = memo(function FallingInput({
  onSubmit,
  wrongKey,
  theme,
  disabled = false,
}: FallingInputProps) {
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 오답 발생 시 흔들기 + 입력 초기화
  useEffect(() => {
    if (wrongKey === 0) return;
    setValue('');
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [wrongKey]);

  // 게임 시작 시 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  }

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="영단어 입력 후 Enter"
        disabled={disabled}
        className={cn(
          'flex-1 border-2 rounded-[12px] px-4 py-3 text-[16px] font-semibold outline-none transition-colors',
          shaking && 'animate-wrong-shake border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
          !shaking && 'bg-white',
        )}
        style={!shaking ? { borderColor: theme.primary } : {}}
        aria-label="단어 입력"
      />
      <button
        onClick={() => { if (value.trim()) { onSubmit(value.trim()); setValue(''); } }}
        disabled={!value.trim() || disabled}
        className="px-5 rounded-[12px] font-bold text-white disabled:opacity-40 transition-all active:scale-95"
        style={{ backgroundColor: theme.primary }}
      >
        확인
      </button>
    </div>
  );
});
