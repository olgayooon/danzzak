import { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import type { Word } from '../../types/word';

interface IncompleteWordsModalProps {
  open: boolean;
  incompleteWords: Word[];
  /** 모달 안에서 수정한 내용을 부모 상태에 반영 */
  onUpdate: (id: string, field: 'term' | 'definition', value: string) => void;
  /** 미완성 제외하고 저장 */
  onSkipAndSave: () => void;
  /** 닫고 직접 수정하러 가기 */
  onClose: () => void;
}

export function IncompleteWordsModal({
  open,
  incompleteWords,
  onUpdate,
  onSkipAndSave,
  onClose,
}: IncompleteWordsModalProps) {
  const [localWords, setLocalWords] = useState<Word[]>([]);

  // 모달이 열릴 때 incompleteWords 스냅샷으로 초기화
  useEffect(() => {
    if (open) {
      setLocalWords(incompleteWords.map(w => ({ ...w })));
    }
  }, [open]);

  function handleChange(id: string, field: 'term' | 'definition', value: string) {
    setLocalWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
    onUpdate(id, field, value);
  }

  const remainingCount = localWords.filter(
    w => !w.term.trim() || !w.definition.trim()
  ).length;
  const allFilled = remainingCount === 0;

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg w-full">
      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-[var(--color-warning-subtle)] flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-[var(--color-warning)]" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-ink)] mb-1">
            미완성 단어가 {incompleteWords.length}개 있어요
          </h2>
          <p className="text-[14px] text-[var(--color-ink-muted)]">
            단어 또는 뜻이 비어 있어요. 지금 바로 채우거나 건너뛰고 저장할 수 있어요.
          </p>
        </div>
      </div>

      {/* 열 헤더 */}
      <div className="grid grid-cols-2 gap-2 px-1 mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">단어</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)]">뜻</span>
      </div>

      {/* 미완성 항목 인라인 편집 */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-5 pr-1">
        {localWords.map(word => {
          const termEmpty = !word.term.trim();
          const defEmpty = !word.definition.trim();
          return (
            <div key={word.id} className="grid grid-cols-2 gap-2">
              <input
                value={word.term}
                onChange={e => handleChange(word.id, 'term', e.target.value)}
                placeholder="영단어 입력"
                className={cn(
                  'border rounded-[10px] px-3 py-2 text-[14px] font-mono outline-none transition-all',
                  termEmpty
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning-subtle)] placeholder:text-[var(--color-warning)]'
                    : 'border-[var(--color-hairline)] bg-[var(--color-surface)]',
                  'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                )}
                aria-label="단어 입력"
              />
              <input
                value={word.definition}
                onChange={e => handleChange(word.id, 'definition', e.target.value)}
                placeholder="뜻 입력"
                className={cn(
                  'border rounded-[10px] px-3 py-2 text-[14px] outline-none transition-all',
                  defEmpty
                    ? 'border-[var(--color-warning)] bg-[var(--color-warning-subtle)] placeholder:text-[var(--color-warning)]'
                    : 'border-[var(--color-hairline)] bg-[var(--color-surface)]',
                  'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                )}
                aria-label="뜻 입력"
              />
            </div>
          );
        })}
      </div>

      {/* 진행 상황 표시 */}
      {!allFilled && (
        <p className="text-[13px] text-[var(--color-ink-muted)] text-center mb-3">
          아직 <span className="font-bold text-[var(--color-warning)]">{remainingCount}개</span> 남았어요
        </p>
      )}

      {/* 액션 */}
      <div className="flex flex-col gap-2">
        <Button variant="primary" className="w-full" onClick={onSkipAndSave}>
          {allFilled ? (
            <>모두 채웠어요! 저장하기 <ArrowRight size={15} /></>
          ) : (
            <>미완성 {remainingCount}개 제외하고 저장</>
          )}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          돌아가서 계속 수정하기
        </Button>
      </div>
    </Modal>
  );
}
