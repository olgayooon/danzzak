import { useRef } from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { Word } from '../../types/word';
import { generateId } from '../../utils/id';
import { cn } from '../../utils/cn';

interface WordTableProps {
  words: Word[];
  onChange: (words: Word[]) => void;
  /** 하이라이트할 미완성 단어 id 목록 */
  highlightIds?: Set<string>;
}

export function WordTable({ words, onChange, highlightIds }: WordTableProps) {
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function updateWord(id: string, field: 'term' | 'definition', value: string) {
    onChange(words.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function deleteWord(id: string) {
    onChange(words.filter(w => w.id !== id));
  }

  function addWord() {
    onChange([...words, { id: generateId(), term: '', definition: '', isWeak: false, stats: { correct: 0, wrong: 0 } }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 px-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">단어</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">뜻</span>
        <span />
      </div>

      <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
        {words.map((word, idx) => {
          const isHighlighted = highlightIds?.has(word.id) ?? false;
          const termEmpty = isHighlighted && !word.term.trim();
          const defEmpty = isHighlighted && !word.definition.trim();

          return (
            <div
              key={word.id}
              ref={el => {
                if (el) rowRefs.current.set(word.id, el);
                else rowRefs.current.delete(word.id);
              }}
              className={cn(
                'grid grid-cols-[1fr_1fr_40px] gap-2 items-center rounded-[10px] transition-all',
                isHighlighted && 'bg-[var(--color-warning-subtle)] px-2 py-1 -mx-2'
              )}
            >
              <input
                value={word.term}
                onChange={e => updateWord(word.id, 'term', e.target.value)}
                placeholder={`단어 ${idx + 1}`}
                className={cn(
                  'rounded-[10px] px-3 py-2 text-[15px] font-mono outline-none transition-all',
                  termEmpty
                    ? 'bg-white border-2 border-[var(--color-warning)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                    : 'bg-white border border-[var(--color-hairline)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                )}
                aria-label={`단어 ${idx + 1}`}
                aria-invalid={termEmpty}
              />
              <input
                value={word.definition}
                onChange={e => updateWord(word.id, 'definition', e.target.value)}
                placeholder={`뜻 ${idx + 1}`}
                className={cn(
                  'rounded-[10px] px-3 py-2 text-[15px] outline-none transition-all',
                  defEmpty
                    ? 'bg-white border-2 border-[var(--color-warning)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                    : 'bg-white border border-[var(--color-hairline)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]'
                )}
                aria-label={`뜻 ${idx + 1}`}
                aria-invalid={defEmpty}
              />
              <button
                onClick={() => deleteWord(word.id)}
                aria-label="단어 삭제"
                className="flex items-center justify-center w-9 h-9 rounded-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={addWord}
        className="flex items-center gap-2 mt-1 px-3 py-2 rounded-[10px] text-[14px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors self-start"
      >
        <Plus size={16} />
        단어 추가
      </button>
    </div>
  );
}
