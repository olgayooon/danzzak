import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWordSet } from '../hooks/useWordSet';
import { useToast } from '../components/ui/Toast';
import { getTheme } from '../types/word';
import { useIsDark } from '../hooks/useIsDark';
import type { ThemePreset, Word } from '../types/word';

interface SharedPayload {
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: Array<{ term: string; definition: string }>;
}

export default function SharedSet() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { createSet } = useWordSet();
  const toast = useToast();
  const isDark = useIsDark();

  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | false>(false);
  const [showAll, setShowAll] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function load() {
      // /s/:code 경로
      if (code) {
        try {
          const res = await fetch(`/api/share?code=${encodeURIComponent(code)}`);
          if (!res.ok) {
            const data = await res.json().catch(() => ({})) as { message?: string };
            setError(data.message ?? '링크가 올바르지 않아요.');
            return;
          }
          const data = await res.json() as SharedPayload;
          setPayload(data);
        } catch {
          setError('불러오기에 실패했어요. 다시 시도해주세요.');
        }
        return;
      }

      // /shared/set — 레거시 hash 방식 (더 이상 생성하지 않지만 기존 링크 호환)
      const hash = location.hash.slice(1);
      if (!hash) { setError('링크가 올바르지 않아요.'); return; }
      setError('이 링크 형식은 더 이상 지원되지 않아요. 새 링크를 받아주세요.');
    }
    load();
  }, [code, location.hash]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle size={40} className="text-[var(--color-danger)]" />
        <p className="text-[16px] font-semibold text-[var(--color-ink)]">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const theme = getTheme(payload.theme ?? 'violet', isDark);
  const preview = showAll ? payload.words : payload.words.slice(0, 6);

  function handleAdd() {
    if (!payload || added) return;
    const newSet = createSet(
      payload.title,
      payload.words.map((w): Word => ({ ...w, id: crypto.randomUUID(), isWeak: false, stats: { correct: 0, wrong: 0 } })),
      payload.emoji,
      payload.theme,
    );
    setAdded(true);
    toast(`"${payload.title}" 단어장을 추가했어요!`, 'success');
    setTimeout(() => navigate(`/study/${newSet.id}`), 800);
  }

  return (
    <div className="max-w-[520px] mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-6"
      >
        <Home size={14} /> 홈
      </button>

      <div
        className="rounded-[20px] p-6 mb-6"
        style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{payload.emoji}</span>
          <div>
            <h1 className="text-[22px] font-extrabold text-[var(--color-ink)]">{payload.title}</h1>
            <p className="text-[14px] text-[var(--color-ink-muted)]">{payload.words.length}개 단어</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] mb-5 overflow-hidden">
        <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--color-ink-muted)] px-4 py-3 border-b border-[var(--color-hairline)]">
          단어 미리보기
        </p>
        <div className="divide-y divide-[var(--color-hairline)]">
          {preview.map((word, i) => (
            <div key={i} className="flex items-baseline gap-3 px-4 py-2.5">
              <span className="text-[14px] font-bold text-[var(--color-ink)] min-w-[100px]">{word.term}</span>
              <span className="text-[13px] text-[var(--color-ink-muted)] truncate">{word.definition}</span>
            </div>
          ))}
        </div>
        {payload.words.length > 6 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="flex items-center gap-1 w-full px-4 py-2.5 text-[13px] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary-subtle)] transition-colors"
          >
            {showAll ? <><ChevronUp size={14} /> 접기</> : <><ChevronDown size={14} /> {payload.words.length - 6}개 더 보기</>}
          </button>
        )}
      </div>

      <Button size="lg" className="w-full" onClick={handleAdd} disabled={added}>
        <Plus size={18} />
        {added ? '추가됐어요! 이동 중...' : '내 단어장에 추가하기'}
      </Button>
    </div>
  );
}
