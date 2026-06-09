import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Type, ChevronDown, FileSpreadsheet, Camera, Upload } from 'lucide-react';
import { extractWordsFromImages } from '../utils/ocr';
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

type Tab = 'paste' | 'manual' | 'csv' | 'ocr';

const TABS: { key: Tab; label: string; icon: typeof Type }[] = [
  { key: 'paste', label: '붙여넣기', icon: Type },
  { key: 'manual', label: '직접 입력', icon: Type },
  { key: 'csv', label: '파일', icon: FileSpreadsheet },
  { key: 'ocr', label: '이미지', icon: Camera },
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

  // OCR
  const [ocrCode, setOcrCode] = useState('');
  const [ocrFiles, setOcrFiles] = useState<File[]>([]);
  const [ocrPreviews, setOcrPreviews] = useState<string[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrCooldown, setOcrCooldown] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const OCR_LIMIT = parseInt(import.meta.env.VITE_MAX_OCR_PER_DAY ?? '10');
  const ocrStorageKey = `ocr-used:${new Date().toISOString().slice(0, 10)}`;
  const [ocrUsedToday, setOcrUsedToday] = useState<number>(() => {
    const stored = localStorage.getItem(ocrStorageKey);
    return stored ? parseInt(stored) : 0;
  });

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

  function handleOcrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 10);
    if (selected.length === 0) return;
    setOcrFiles(prev => {
      const merged = [...prev, ...selected].slice(0, 10);
      setOcrPreviews(merged.map(f => URL.createObjectURL(f)));
      return merged;
    });
    e.target.value = '';
  }

  function handleOcrRemove(idx: number) {
    setOcrFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setOcrPreviews(next.map(f => URL.createObjectURL(f)));
      return next;
    });
  }

  async function handleOcrSubmit() {
    if (ocrFiles.length === 0 || !ocrCode.trim()) return;
    if (ocrFiles.some(f => f.size >= 5 * 1024 * 1024)) {
      toast('이미지를 압축하는 중이에요...', 'success');
    }
    setOcrLoading(true);
    try {
      const data = await extractWordsFromImages(ocrFiles, ocrCode.trim());
      const parsed: Word[] = data.words.map((w: { term: string; definition: string }) => ({
        id: generateId(), term: w.term, definition: w.definition, isWeak: false, stats: { correct: 0, wrong: 0 },
      }));
      if (parsed.length === 0) {
        toast('이미지에서 단어를 찾지 못했어요.', 'error');
        return;
      }
      setWords(parsed);
      setTab('manual');
      toast(`${parsed.length}개 단어를 인식했어요!`, 'success');
      const newUsed = data.used ?? ocrUsedToday + 1;
      setOcrUsedToday(newUsed);
      localStorage.setItem(ocrStorageKey, String(newUsed));
      setOcrCooldown(true);
      setTimeout(() => setOcrCooldown(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR 처리 중 오류가 발생했어요.';
      toast(msg, 'error');
    } finally {
      setOcrLoading(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-6">
      <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[var(--color-ink)] tracking-tight mb-1">
        새 단어장 만들기
      </h1>
      <p className="text-[13px] text-[var(--color-ink-muted)] mb-6">
        단어를 입력하면 즉시 퀴즈와 시험지를 만들 수 있어요.
      </p>

      <div className="flex flex-col gap-6">
        {/* 제목 & 이모지 */}
        <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] p-4 sm:p-6">
          <h2 className="text-[14px] font-bold text-[var(--color-ink)] mb-3">단어장 정보</h2>
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
        <div className="bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-hairline)] overflow-hidden">
          <div className="flex border-b border-[var(--color-hairline)]">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] sm:text-[13px] font-semibold transition-colors',
                  tab === key
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                )}
              >
                <Icon size={13} />
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
            {tab === 'ocr' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] text-[var(--color-ink-muted)]">
                    사진을 올리면 AI가 단어를 자동으로 인식해요.
                  </p>
                  <div className={cn(
                    'shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold',
                    ocrUsedToday >= OCR_LIMIT
                      ? 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                      : 'bg-[var(--color-hairline)] text-[var(--color-ink-muted)]'
                  )}>
                    오늘 {ocrUsedToday}/{OCR_LIMIT}회
                  </div>
                </div>
                {ocrUsedToday >= OCR_LIMIT && (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    오늘 이미지 인식을 모두 사용했어요. 내일 다시 시도해주세요.
                  </p>
                )}

                {/* 이미지 업로드 */}
                {ocrPreviews.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ocrPreviews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20">
                        <img src={src} alt={`이미지 ${idx + 1}`} className="w-full h-full object-cover rounded-[10px] border border-[var(--color-hairline)]" />
                        <button
                          onClick={() => handleOcrRemove(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-danger)] text-white rounded-full text-[11px] flex items-center justify-center leading-none"
                          aria-label="이미지 제거"
                        >×</button>
                      </div>
                    ))}
                    {ocrFiles.length < 10 && (
                      <button
                        onClick={() => ocrInputRef.current?.click()}
                        className="w-20 h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[var(--color-hairline)] rounded-[10px] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all text-[var(--color-ink-faint)]"
                      >
                        <Upload size={16} />
                        <span className="text-[10px]">추가</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => ocrInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 h-36 border-2 border-dashed border-[var(--color-hairline)] rounded-[14px] cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all"
                  >
                    <Upload size={28} className="text-[var(--color-ink-faint)]" />
                    <p className="text-[13px] text-[var(--color-ink-muted)]">이미지 클릭하여 업로드 (최대 10장)</p>
                    <p className="text-[11px] text-[var(--color-ink-faint)]">JPG, PNG, WEBP 지원</p>
                  </div>
                )}
                <input
                  ref={ocrInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleOcrFileChange}
                />

                {/* 접속 코드 */}
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block">접속 코드</label>
                  <TextInput
                    id="ocr-code"
                    value={ocrCode}
                    onChange={e => setOcrCode(e.target.value)}
                    placeholder="접속 코드를 입력하세요"
                    className="w-full"
                    onKeyDown={e => e.key === 'Enter' && !ocrLoading && !ocrCooldown && ocrFiles.length > 0 && handleOcrSubmit()}
                  />
                </div>

                <Button
                  onClick={handleOcrSubmit}
                  disabled={ocrFiles.length === 0 || !ocrCode.trim() || ocrLoading || ocrCooldown}
                >
                  {ocrLoading ? '인식 중...' : ocrCooldown ? '잠시 후 다시 시도하세요' : '단어 인식하기'}
                </Button>
              </div>
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
