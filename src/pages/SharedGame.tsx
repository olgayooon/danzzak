import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, AlertCircle, Play, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWordSet } from '../hooks/useWordSet';
import { SHARED_GAME_SESSION_KEY, decodeGameShare } from '../utils/shareGame';
import { getTheme } from '../types/word';
import { useIsDark } from '../hooks/useIsDark';
import { GAME_MODE_INFO } from '../types/game';
import { generateId } from '../utils/id';
import { cn } from '../utils/cn';

const SCORE_KEY_PREFIX = 'danzzak-scores-';

interface LocalScore {
  nickname: string;
  correct: number;
  wrong: number;
  combo: number;
  playedAt: string;
}

export default function SharedGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addSet } = useWordSet();

  const isDark = useIsDark();
  const [payload, setPayload] = useState<ReturnType<typeof decodeGameShare>>(null);
  const [error, setError]     = useState(false);
  const [nickname, setNickname] = useState('');
  const [pin, setPin]           = useState('');
  const [scores, setScores]     = useState<LocalScore[]>([]);
  const shareHash = useRef('');

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash) { setError(true); return; }
    const p = decodeGameShare(hash);
    if (!p) { setError(true); return; }
    shareHash.current = hash.slice(0, 10);
    setPayload(p);
    // 이전 기록 로드
    try {
      const raw = localStorage.getItem(SCORE_KEY_PREFIX + shareHash.current);
      if (raw) setScores(JSON.parse(raw) as LocalScore[]);
    } catch { /* ignore */ }
  }, [location.hash]);

  function handleStart() {
    if (!payload || !nickname.trim()) return;

    // 임시 WordSet 생성 (스토어에 추가, 세션 종료 후 삭제 예정)
    const tempId = `_shared_${generateId()}`;
    const tempSet = {
      id: tempId,
      title: payload.title,
      emoji: payload.emoji,
      theme: payload.theme,
      words: payload.words.map(w => ({
        id: generateId(), term: w.term, definition: w.definition,
        isWeak: false, stats: { correct: 0, wrong: 0 },
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSet(tempSet);

    // 닉네임 + PIN + 공유 해시를 세션스토리지에 저장
    sessionStorage.setItem(SHARED_GAME_SESSION_KEY, JSON.stringify({
      nickname: nickname.trim(),
      pin,
      shareHash: shareHash.current,
      tempSetId: tempId,
      tempSet,
      questionType: payload.questionType,
      returnPath: location.pathname + location.search + location.hash,
    }));

    navigate(`/game/${payload.gameMode}/${tempId}`);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle size={40} className="text-[var(--color-danger)]" />
        <p className="text-[16px] font-semibold text-[var(--color-ink)]">링크가 올바르지 않아요.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>홈으로</Button>
      </div>
    );
  }

  if (!payload) return null;

  const theme = getTheme((payload.theme as import('../types/word').ThemePreset) ?? 'violet', isDark);
  const modeInfo = GAME_MODE_INFO[payload.gameMode];
  const canStart = nickname.trim().length > 0;

  return (
    <div className="max-w-[440px] mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-6"
      >
        <Home size={14} /> 홈
      </button>

      {/* 게임 헤더 */}
      <div
        className="rounded-[20px] p-6 mb-6 text-center"
        style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}
      >
        <div className="text-4xl mb-3">{payload.emoji}</div>
        <h1 className="text-[20px] font-extrabold text-[var(--color-ink)] mb-1">{payload.title}</h1>
        <p className="text-[13px] text-[var(--color-ink-muted)]">{payload.words.length}개 단어</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold" style={{ backgroundColor: theme.primary + '20', color: theme.primary }}>
          {modeInfo.emoji} {modeInfo.label}
        </div>
      </div>

      {/* 닉네임 + PIN 입력 */}
      <div className="bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] p-5 mb-5">
        <h2 className="text-[15px] font-bold text-[var(--color-ink)] mb-4">게임 시작 정보</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block">
              닉네임 <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 20))}
              placeholder="나를 나타낼 닉네임 입력"
              className="w-full border border-[var(--color-hairline)] rounded-[10px] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)] transition-all"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[var(--color-ink-muted)] mb-1.5 block">
              PIN (4자리, 선택)
            </label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              inputMode="numeric"
              className="w-full border border-[var(--color-hairline)] rounded-[10px] px-3 py-2.5 text-[14px] font-mono tracking-[0.3em] outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-subtle)] transition-all"
            />
            <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">
              같은 PIN으로 기록을 이어갈 수 있어요
            </p>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full mb-8"
        onClick={handleStart}
        disabled={!canStart}
      >
        <Play size={18} />
        게임 시작
      </Button>

      {/* 로컬 기록 */}
      {scores.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-hairline)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-hairline)]">
            <Trophy size={15} className="text-[var(--color-warning)]" />
            <p className="text-[13px] font-bold text-[var(--color-ink)]">이 기기의 기록</p>
          </div>
          <div className="divide-y divide-[var(--color-hairline)]">
            {scores
              .slice()
              .sort((a, b) => b.correct - a.correct)
              .slice(0, 10)
              .map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn(
                    'text-[13px] font-bold w-5 text-center',
                    i === 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-faint)]'
                  )}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[14px] font-semibold text-[var(--color-ink)]">{s.nickname}</span>
                  <span className="text-[13px] text-[var(--color-success)] font-bold">{s.correct}정답</span>
                  <span className="text-[11px] text-[var(--color-ink-faint)]">
                    {new Date(s.playedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
