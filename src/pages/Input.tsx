import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Type, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input as TextInput } from '../components/ui/Input';
import { WordTable } from '../components/input/WordTable';
import { CsvUpload } from '../components/input/CsvUpload';
import { IncompleteWordsModal } from '../components/input/IncompleteWordsModal';
import { useWordSet } from '../hooks/useWordSet';
import { useToast } from '../components/ui/Toast';
import { parseText } from '../utils/textParser';
import type { Word } from '../types/word';
import type { ThemePreset } from '../types/word';
import { THEME_PRESETS } from '../types/word';
import { generateId } from '../utils/id';
import { cn } from '../utils/cn';

const EMOJI_OPTIONS = ['📚', '🔤', '🌍', '🎓', '⭐', '🔥', '💡', '🎯', '🧠', '📖'];

type Tab = 'paste' | 'manual' | 'csv';

const TABS: { key: Tab; label: string; icon: typeof Type }[] = [
  { key: 'paste', label: '붙여넣기', icon: Type },
  { key: 'manual', label: '직접 입력', icon: Type },
  { key: 'csv', label: 'CSV 업로드', icon: FileSpreadsheet },
];

function makeBlankWord(): Word {
  return { id: generateId(), term: '', definition: '', isWeak: false, stats: { correct: 0, wrong: 0 } };
}

export default function Input() {
  const navigate = useNavigate();
  const { createSet } = useWordSet();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('paste');
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [theme, setTheme] = useState<ThemePreset>('violet');
  const [pasteText, setPasteText] = useState('');
  const [words, setWords] = useState<Word[]>([makeBlankWord(), makeBlankWord(), makeBlankWord()]);

  // 미완성 검사
  const [incompleteModalOpen, setIncompleteModalOpen] = useState(false);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  function getIncompleteWords(): Word[] {
    return words.filter(w => {
      const hasTerm = w.term.trim().length > 0;
      const hasDef = w.definition.trim().length > 0;
      return hasTerm !== hasDef; // 하나만 채워진 경우
    });
  }

  function handlePasteParse() {
    const parsed = parseText(pasteText);
    if (parsed.length === 0) {
      toast('단어를 인식하지 못했어요. "단어 - 뜻" 형식으로 입력해주세요.', 'error');
      return;
    }
    setWords(parsed);
    setTab('manual');
    toast(`${parsed.length}개 단어를 불러왔어요!`, 'success');
  }

  function handleCsvParsed(parsed: Word[]) {
    setWords(parsed);
    setTab('manual');
    toast(`${parsed.length}개 단어를 불러왔어요!`, 'success');
  }

  function doSave(wordsToSave: Word[]) {
    const validWords = wordsToSave.filter(w => w.term.trim() && w.definition.trim());
    const newSet = createSet(title.trim(), validWords, emoji, theme);
    toast('단어장을 저장했어요!', 'success');
    navigate(`/study/${newSet.id}`);
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

    doSave(words);
  }

  function handleModalUpdate(id: string, field: 'term' | 'definition', value: string) {
    setWords(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  }

  function handleSkipAndSave() {
    setIncompleteModalOpen(false);
    setHighlightIds(new Set());
    doSave(words);
  }

  function handleModalClose() {
    setIncompleteModalOpen(false);
    // 하이라이트는 유지 — 테이블에서 확인하도록
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <h1 className="text-[28px] font-extrabold text-[var(--color-ink)] tracking-tight mb-2">
        새 단어장 만들기
      </h1>
      <p className="text-[15px] text-[var(--color-ink-muted)] mb-8">
        단어를 입력하면 즉시 퀴즈와 시험지를 만들 수 있어요.
      </p>

      <div className="flex flex-col gap-6">
        {/* 제목 & 이모지 */}
        <div className="bg-white rounded-[20px] border border-[var(--color-hairline)] p-6">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">단어장 정보</h2>
          <div className="flex gap-3 items-end">
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
                placeholder="예: 수능 필수 어휘 1000"
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4">
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

        {/* 입력 방식 탭 */}
        <div className="bg-white rounded-[20px] border border-[var(--color-hairline)] overflow-hidden">
          <div className="flex border-b border-[var(--color-hairline)]">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold transition-colors',
                  tab === key
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'paste' && (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-[var(--color-ink-muted)]">
                  <strong>단어 - 뜻</strong> 또는 <strong>단어: 뜻</strong> 형식으로 붙여넣기 하세요.
                </p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={`apple - 사과\nbeautiful - 아름다운\ncomputer - 컴퓨터`}
                  rows={10}
                  className={cn(
                    'w-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[10px] px-4 py-3 text-[14px] font-mono outline-none resize-none',
                    'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)] transition-all'
                  )}
                />
                <Button variant="secondary" onClick={handlePasteParse} disabled={!pasteText.trim()}>
                  단어 목록으로 변환
                </Button>
              </div>
            )}
            {tab === 'manual' && (
              <WordTable
                words={words}
                onChange={ws => {
                  setWords(ws);
                  // 수정된 단어가 완성되면 하이라이트 해제
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
            )}
            {tab === 'csv' && (
              <CsvUpload
                onParsed={handleCsvParsed}
                onError={msg => toast(msg, 'error')}
              />
            )}
          </div>
        </div>

        <Button size="lg" onClick={handleSaveClick} className="w-full">
          <ArrowRight size={18} />
          단어장 저장하고 학습 시작
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
