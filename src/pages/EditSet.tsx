import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input as TextInput } from '../components/ui/Input';
import { WordTable } from '../components/input/WordTable';
import { IncompleteWordsModal } from '../components/input/IncompleteWordsModal';
import { useWordSet } from '../hooks/useWordSet';
import { useToast } from '../components/ui/Toast';
import type { ThemePreset } from '../types/word';
import { THEME_PRESETS } from '../types/word';
import { cn } from '../utils/cn';

const EMOJI_OPTIONS = ['📚', '🔤', '🌍', '🎓', '⭐', '🔥', '💡', '🎯', '🧠', '📖'];

export default function EditSet() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { sets, saveSet } = useWordSet();
  const toast = useToast();

  const wordSet = sets.find(s => s.id === setId);

  const [title, setTitle] = useState(wordSet?.title ?? '');
  const [emoji, setEmoji] = useState(wordSet?.emoji ?? '📚');
  const [theme, setTheme] = useState<ThemePreset>(wordSet?.theme ?? 'violet');
  const [words, setWords] = useState(wordSet?.words ?? []);

  const [incompleteModalOpen, setIncompleteModalOpen] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  if (!wordSet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-ink-muted)]">단어장을 찾을 수 없어요.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  function getIncompleteWords() {
    return words.filter(w => {
      const hasTerm = w.term.trim().length > 0;
      const hasDef = w.definition.trim().length > 0;
      return hasTerm !== hasDef;
    });
  }

  function doSave() {
    const validWords = words.filter(w => w.term.trim() && w.definition.trim());
    saveSet({ ...wordSet!, title: title.trim(), emoji, theme, words: validWords });
    toast('단어장을 저장했어요!', 'success');
    navigate(`/study/${wordSet!.id}`);
  }

  function handleSaveClick() {
    if (!title.trim()) {
      toast('단어장 제목을 입력해주세요.', 'error');
      return;
    }
    const validWords = words.filter(w => w.term.trim() && w.definition.trim());
    if (validWords.length < 1) {
      toast('단어를 1개 이상 입력해주세요.', 'error');
      return;
    }

    const incomplete = getIncompleteWords();
    if (incomplete.length > 0) {
      setHighlightIds(new Set(incomplete.map(w => w.id)));
      setIncompleteModalOpen(true);
      return;
    }

    doSave();
  }

  function handleModalUpdate(id: string, field: 'term' | 'definition', value: string) {
    setWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function handleSkipAndSave() {
    setIncompleteModalOpen(false);
    setHighlightIds(new Set());
    doSave();
  }

  function handleModalClose() {
    setIncompleteModalOpen(false);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/study/${setId}`)} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 뒤로
        </button>
        <h1 className="text-[24px] font-extrabold text-[var(--color-ink)] tracking-tight">단어장 수정</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* 기본 정보 */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] p-6">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">단어장 정보</h2>
          <div className="flex gap-3 items-end mb-4">
            <div className="relative">
              <select
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                aria-label="이모지 선택"
                className="appearance-none w-14 h-12 text-center text-2xl bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[10px] cursor-pointer outline-none focus:border-[var(--color-primary)]"
              >
                {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 bottom-3.5 text-[var(--color-ink-faint)] pointer-events-none" />
            </div>
            <div className="flex-1">
              <TextInput
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="단어장 제목"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-[var(--color-ink-muted)] mb-2">테마 색상</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(THEME_PRESETS) as [ThemePreset, typeof THEME_PRESETS[ThemePreset]][]).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  aria-label={`${preset.label} 테마`}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    theme === key ? 'scale-110 border-[var(--color-ink)]' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: preset.primary }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 단어 편집 */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[var(--color-ink)]">단어 목록</h2>
            <span className="text-[13px] text-[var(--color-ink-muted)]">{words.filter(w => w.term && w.definition).length}개</span>
          </div>
          <WordTable
            words={words}
            onChange={ws => {
              setWords(ws);
              if (highlightIds.size > 0) {
                setHighlightIds(prev => {
                  const next = new Set(prev);
                  ws.forEach(w => {
                    if (w.term.trim() && w.definition.trim()) next.delete(w.id);
                  });
                  return next;
                });
              }
            }}
            highlightIds={highlightIds}
          />
        </div>

        <Button size="lg" onClick={handleSaveClick} className="w-full">
          <Save size={18} />
          변경사항 저장
        </Button>
      </div>

      <IncompleteWordsModal
        open={incompleteModalOpen}
        incompleteWords={getIncompleteWords()}
        onUpdate={handleModalUpdate}
        onSkipAndSave={handleSkipAndSave}
        onClose={handleModalClose}
      />
    </div>
  );
}
