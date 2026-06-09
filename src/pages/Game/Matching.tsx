import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Home, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray } from '../../utils/gameUtils';
import { playSound, triggerConfetti } from '../../utils/feedback';
import { getTheme } from '../../types/word';
import { useIsDark } from '../../hooks/useIsDark';
import type { Word } from '../../types/word';
import type { GameResult } from '../../types/game';
import { cn } from '../../utils/cn';

const VISIBLE      = 5;
const TIMER_START  = 10;
const MAX_HEARTS   = 5;

type Phase = 'playing' | 'won' | 'gameover';

function insertAt<T>(arr: T[], item: T, idx: number): T[] {
  const copy = [...arr];
  copy.splice(idx, 0, item);
  return copy;
}

function randomIdx(len: number) {
  return Math.floor(Math.random() * (len + 1));
}

/** Pick two insertion indices that differ (best-effort) */
function twoDistinctIdx(len: number): [number, number] {
  const a = randomIdx(len);
  let b = randomIdx(len);
  if (len > 0 && b === a) b = (b + 1) % (len + 1);
  return [a, b];
}

// ── Result screen ────────────────────────────────────────────────────

interface MatchResultProps {
  result: GameResult;
  hearts: number;
  onRetry: () => void;
}

function MatchResultScreen({ result, hearts, onRetry }: MatchResultProps) {
  const navigate = useNavigate();
  const mins = Math.floor(result.duration / 60);
  const secs = result.duration % 60;
  const isWon = result.score !== undefined && result.score > 0;

  const grade =
    (result.score ?? 0) >= 2000 ? { emoji: '🏆', label: '완벽해요!',    color: 'text-[var(--color-accent-yellow)]' } :
    (result.score ?? 0) >= 1000 ? { emoji: '🎉', label: '잘 했어요!',  color: 'text-[var(--color-success)]' } :
    (result.score ?? 0) >= 400  ? { emoji: '💪', label: '조금 더 연습해요', color: 'text-[var(--color-warning)]' } :
                                   { emoji: '📚', label: '다시 도전해봐요', color: 'text-[var(--color-danger)]' };

  return (
    <div className="flex flex-col items-center gap-8 py-12 animate-fade-in">
      <div className="text-6xl">{isWon ? grade.emoji : '💔'}</div>
      <div className="text-center">
        <p className={`text-[18px] font-semibold mb-2 ${grade.color}`}>
          {isWon ? grade.label : '하트가 다 떨어졌어요'}
        </p>
        <p className={`text-[52px] font-extrabold tracking-tight ${grade.color}`}>
          {result.score?.toLocaleString() ?? 0}
        </p>
        <p className="text-[13px] text-[var(--color-ink-muted)]">점수</p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[340px]">
        {[
          { label: '매칭 완료',   value: `${result.correct}쌍`,  color: 'text-[var(--color-primary)]' },
          { label: '남은 하트',   value: '❤️'.repeat(Math.max(0, hearts)) || '없음', color: 'text-[var(--color-danger)]' },
          { label: '최고 콤보',   value: `${result.combo}`,      color: 'text-[var(--color-accent-yellow)]' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center bg-[var(--color-surface)] rounded-[14px] p-4 border border-[var(--color-hairline)] gap-1">
            <span className={`text-[20px] font-bold ${stat.color} text-center leading-tight`}>{stat.value}</span>
            <span className="text-[11px] text-[var(--color-ink-muted)] text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-[var(--color-ink-muted)]">
        소요 시간: {mins > 0 ? `${mins}분 ` : ''}{secs}초
      </p>

      <div className="text-[12px] text-[var(--color-ink-faint)] text-center">
        <p>매칭 {result.correct}쌍 × 100 + 하트 {Math.max(0, hearts)}개 × 200 + 콤보 {result.combo} × 20</p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" onClick={onRetry}>
          <RotateCcw size={16} /> 다시 하기
        </Button>
        {!result.setId.startsWith('_shared_') && (
          <Button variant="secondary" onClick={() => navigate(`/study/${result.setId}`)}>
            <BookOpen size={16} /> 학습 모드
          </Button>
        )}
        <Button variant="utility" onClick={() => navigate('/')}>
          <Home size={16} /> 홈
        </Button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

export default function MatchingGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate  = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const isDark = useIsDark();
  const theme = getTheme(wordSet?.theme ?? 'violet', isDark);

  // — Refs —
  const startTimeRef    = useRef(Date.now());
  const resultSavedRef  = useRef(false);

  // — Game state —
  const [pool,         setPool]         = useState<Word[]>([]);
  const [termList,     setTermList]     = useState<Word[]>([]);
  const [defList,      setDefList]      = useState<Word[]>([]);
  const [selected,     setSelected]     = useState<{ id: string; side: 'term' | 'def' } | null>(null);
  const [wrongFlash,   setWrongFlash]   = useState<Set<string>>(new Set());
  const [hearts,       setHearts]       = useState(3);
  const [timer,        setTimer]        = useState(TIMER_START);
  const [combo,        setCombo]        = useState(0);
  const [maxCombo,     setMaxCombo]     = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [wrongCount,   setWrongCount]   = useState(0);
  const [phase,        setPhase]        = useState<Phase>('playing');
  const [result,       setResult]       = useState<GameResult | null>(null);

  // — Initialise —
  function initGame(words: Word[]) {
    const shuffled = shuffleArray(words);
    const initial  = shuffled.slice(0, VISIBLE);
    setPool(shuffled.slice(VISIBLE));
    setTermList(shuffleArray(initial));
    setDefList(shuffleArray(initial));
    setSelected(null);
    setWrongFlash(new Set());
    setHearts(3);
    setTimer(TIMER_START);
    setCombo(0);
    setMaxCombo(0);
    setTotalMatched(0);
    setWrongCount(0);
    setPhase('playing');
    setResult(null);
    resultSavedRef.current = false;
    startTimeRef.current = Date.now();
  }

  useEffect(() => {
    if (wordSet) initGame(wordSet.words);
  }, [wordSet?.id]);

  // — Timer tick (setTimeout chain) —
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setTimeout(() => {
      setTimer(t => {
        if (t <= 1) {
          setHearts(h => h - 1);
          return TIMER_START;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [timer, phase]);

  // — Hearts → game over —
  useEffect(() => {
    if (hearts <= 0 && phase === 'playing') {
      setPhase('gameover');
    }
  }, [hearts, phase]);

  // — Phase transition → record result —
  useEffect(() => {
    if ((phase === 'won' || phase === 'gameover') && !resultSavedRef.current) {
      resultSavedRef.current = true;
      if (phase === 'won') {
        playSound('clear');
        triggerConfetti();
      }
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const finalHearts = phase === 'gameover' ? 0 : hearts;
      const score = totalMatched * 100 + Math.max(0, finalHearts) * 200 + maxCombo * 20;
      const gameResult: GameResult = {
        setId: wordSet!.id,
        mode: 'matching',
        correct: totalMatched,
        wrong: wrongCount,
        duration,
        combo: maxCombo,
        playedAt: new Date().toISOString(),
        score,
      };
      addRecord(gameResult);
      setResult(gameResult);
    }
  }, [phase]);

  // — Handle card tap —
  function handleCard(id: string, side: 'term' | 'def') {
    if (phase !== 'playing') return;
    if (wrongFlash.has(id)) return;

    // First selection
    if (!selected) {
      setSelected({ id, side });
      return;
    }
    // Deselect
    if (selected.id === id && selected.side === side) {
      setSelected(null);
      return;
    }
    // Switch selection on same side
    if (selected.side === side) {
      setSelected({ id, side });
      return;
    }

    // Opposite side → evaluate
    const termId = side === 'def' ? selected.id : id;
    const defId  = side === 'def' ? id : selected.id;
    setSelected(null);

    if (termId === defId) {
      // ✅ Correct match
      updateWordStats(wordSet!.id, termId, true);
      playSound('correct');

      const newTermList = termList.filter(w => w.id !== termId);
      const newDefList  = defList.filter(w => w.id !== termId);
      const newPool     = [...pool];

      let finalTermList = newTermList;
      let finalDefList  = newDefList;

      if (newPool.length > 0) {
        const nextWord = newPool.shift()!;
        const [tIdx, dIdx] = twoDistinctIdx(newTermList.length);
        finalTermList = insertAt(newTermList, nextWord, tIdx);
        finalDefList  = insertAt(newDefList,  nextWord, dIdx);
      }

      const newCombo    = combo + 1;
      const newMaxCombo = Math.max(maxCombo, newCombo);
      const newMatched  = totalMatched + 1;
      const heartGain   = newCombo % 3 === 0 ? 1 : 0;
      const newHearts   = Math.min(hearts + heartGain, MAX_HEARTS);
      const isWon       = newPool.length === 0 && finalTermList.length === 0;

      setPool(newPool);
      setTermList(finalTermList);
      setDefList(finalDefList);
      setCombo(newCombo);
      setMaxCombo(newMaxCombo);
      setTotalMatched(newMatched);
      setHearts(newHearts);
      setTimer(TIMER_START);
      if (isWon) setPhase('won');
    } else {
      // ❌ Wrong match
      updateWordStats(wordSet!.id, termId, false);
      playSound('wrong');

      setWrongCount(n => n + 1);
      setCombo(0);
      setHearts(h => h - 1);
      const bad = new Set([termId, defId]);
      setWrongFlash(bad);
      setTimeout(() => setWrongFlash(new Set()), 600);
    }
  }

  function handleRetry() {
    if (wordSet) initGame(wordSet.words);
  }

  // — Guards —
  if (restorePending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!wordSet || wordSet.words.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-ink-muted)]">단어가 2개 이상 필요해요.</p>
        <Button variant="secondary" onClick={() => navigate(returnPath)}>돌아가기</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <MatchResultScreen
          result={result}
          hearts={phase === 'gameover' ? 0 : hearts}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // — Timer colour —
  const timerColor =
    timer <= 3 ? 'text-[var(--color-danger)]' :
    timer <= 6 ? 'text-[var(--color-warning)]' :
    'text-[var(--color-ink-muted)]';

  const totalWords = wordSet.words.length;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(returnPath)}
          className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft size={16} /> 나가기
        </button>

        {/* Hearts */}
        <div className="flex items-center gap-0.5 text-[18px]">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <span key={i} className={cn('transition-all', i < hearts ? 'opacity-100' : 'opacity-20 grayscale')}>
              ❤️
            </span>
          ))}
        </div>

        {/* Timer + progress */}
        <div className="flex items-center gap-3 text-[14px]">
          <span className={cn('font-bold tabular-nums transition-colors', timerColor)}>
            {timer}s
          </span>
          <span className="text-[var(--color-ink-muted)]">
            {totalMatched}/{totalWords}
          </span>
        </div>
      </div>

      {/* Combo badge */}
      {combo >= 3 && (
        <div className="flex justify-center mb-3">
          <span
            key={combo}
            className="text-[13px] font-bold text-[var(--color-warning)] animate-combo-spring"
          >
            🔥 {combo} 콤보!
          </span>
        </div>
      )}

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-[var(--color-hairline)] mb-5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${(timer / TIMER_START) * 100}%`,
            backgroundColor: timer <= 3 ? 'var(--color-danger)' : timer <= 6 ? 'var(--color-warning)' : theme.primary,
          }}
        />
      </div>

      <p className="text-[12px] text-[var(--color-ink-muted)] text-center mb-4">
        단어와 뜻을 연결하세요
      </p>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Terms column */}
        <div className="flex flex-col gap-2">
          {termList.map(word => {
            const isSelected = selected?.id === word.id && selected.side === 'term';
            const isWrong    = wrongFlash.has(word.id);
            return (
              <button
                key={word.id}
                onClick={() => handleCard(word.id, 'term')}
                className={cn(
                  'h-[60px] px-3 rounded-[12px] border-2 text-[14px] font-bold text-left',
                  'flex items-center transition-all duration-150 overflow-hidden',
                  isWrong    && 'border-[var(--color-danger)]  bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]  animate-wrong-shake',
                  isSelected && !isWrong && 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]',
                  !isSelected && !isWrong && 'border-[var(--color-hairline)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]',
                )}
                style={isSelected ? { borderColor: theme.primary, backgroundColor: theme.cardBg } : {}}
              >
                <span className="truncate">{word.term}</span>
              </button>
            );
          })}
        </div>

        {/* Definitions column */}
        <div className="flex flex-col gap-2">
          {defList.map(word => {
            const isSelected = selected?.id === word.id && selected.side === 'def';
            const isWrong    = wrongFlash.has(word.id);
            return (
              <button
                key={word.id}
                onClick={() => handleCard(word.id, 'def')}
                className={cn(
                  'h-[60px] px-3 rounded-[12px] border-2 text-[13px] text-left',
                  'flex items-center transition-all duration-150 overflow-hidden',
                  isWrong    && 'border-[var(--color-danger)]  bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]  animate-wrong-shake',
                  isSelected && !isWrong && 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]',
                  !isSelected && !isWrong && 'border-[var(--color-hairline)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]',
                )}
                style={isSelected ? { borderColor: theme.primary } : {}}
              >
                <span className="line-clamp-2 leading-tight">{word.definition}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
