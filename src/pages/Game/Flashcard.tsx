import { useState, useReducer, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/games/ProgressBar';
import { ResultScreen } from '../../components/games/ResultScreen';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { useTTS } from '../../hooks/useTTS';
import { shuffleArray } from '../../utils/gameUtils';
import { playSound, triggerParticleAt, triggerConfetti, triggerGlow } from '../../utils/feedback';
import { THEME_PRESETS } from '../../types/word';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

interface State {
  words: Word[];
  index: number;
  flipped: boolean;
  correct: number;
  wrong: number;
  combo: number;
  maxCombo: number;
  startTime: number;
  done: boolean;
  round: number;
  roundWrongWords: Word[];  // 현재 라운드에서 틀린 단어
  allWrongWords: Word[];    // 전체 오답 (결과 화면용)
}

type Action =
  | { type: 'FLIP' }
  | { type: 'ANSWER'; correct: boolean; word: Word }
  | { type: 'RESET'; words: Word[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FLIP':
      return { ...state, flipped: !state.flipped };
    case 'ANSWER': {
      const correct = action.correct ? state.correct + 1 : state.correct;
      const wrong = action.correct ? state.wrong : state.wrong + 1;
      const combo = action.correct ? state.combo + 1 : 0;
      const maxCombo = Math.max(state.maxCombo, combo);

      const roundWrongWords = action.correct
        ? state.roundWrongWords
        : state.roundWrongWords.find(w => w.id === action.word.id)
          ? state.roundWrongWords
          : [...state.roundWrongWords, action.word];

      const allWrongWords = (!action.correct && !state.allWrongWords.find(w => w.id === action.word.id))
        ? [...state.allWrongWords, action.word]
        : state.allWrongWords;

      const nextIndex = state.index + 1;

      if (nextIndex >= state.words.length) {
        if (roundWrongWords.length > 0) {
          // 틀린 단어만 다음 라운드로
          return {
            ...state,
            words: shuffleArray(roundWrongWords),
            index: 0,
            flipped: false,
            correct,
            wrong,
            combo: 0,
            maxCombo,
            roundWrongWords: [],
            allWrongWords,
            round: state.round + 1,
            done: false,
          };
        }
        // 모두 맞춤 → 게임 종료
        return { ...state, correct, wrong, combo: 0, maxCombo, roundWrongWords: [], allWrongWords, index: nextIndex, flipped: false, done: true };
      }

      return { ...state, correct, wrong, combo, maxCombo, roundWrongWords, allWrongWords, index: nextIndex, flipped: false };
    }
    case 'RESET':
      return init(action.words);
    default:
      return state;
  }
}

function init(words: Word[]): State {
  return {
    words: shuffleArray(words),
    index: 0,
    flipped: false,
    correct: 0,
    wrong: 0,
    combo: 0,
    maxCombo: 0,
    startTime: Date.now(),
    done: false,
    round: 1,
    roundWrongWords: [],
    allWrongWords: [],
  };
}

export default function FlashcardGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const theme = wordSet ? THEME_PRESETS[wordSet.theme] : THEME_PRESETS.violet;

  const [state, dispatch] = useReducer(reducer, wordSet?.words ?? [], init);
  const [result, setResult] = useState<GameResult | null>(null);
  const { speak } = useTTS();
  const cardRef = useRef<HTMLDivElement>(null);

  const [dragY, setDragY] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const didDragRef = useRef(false);
  const SWIPE_THRESHOLD = 80;

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // 게임 종료 감지
  useEffect(() => {
    if (state.done && !result && wordSet) {
      const gameResult: GameResult = {
        setId: wordSet.id,
        mode: 'flashcard',
        correct: state.correct,
        wrong: state.wrong,
        duration: Math.round((Date.now() - state.startTime) / 1000),
        combo: state.maxCombo,
        playedAt: new Date().toISOString(),
      };
      playSound('clear');
      triggerConfetti();
      addRecord(gameResult);
      setResult(gameResult);
    }
  }, [state.done]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    didDragRef.current = false;
    isDraggingRef.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dy = e.clientY - dragStartYRef.current;
    if (Math.abs(dy) > 8) didDragRef.current = true;
    setDragY(dy);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const dy = e.clientY - dragStartYRef.current;
    setDragY(0);
    if (Math.abs(dy) >= SWIPE_THRESHOLD) {
      handleAnswerRef.current(dy < 0);
    } else if (!didDragRef.current) {
      dispatch({ type: 'FLIP' });
    }
  }, []);

  const currentWord = state.words[state.index];

  function handleAnswer(correct: boolean) {
    if (!wordSet || !currentWord) return;
    updateWordStats(wordSet.id, currentWord.id, correct);

    if (correct) {
      const newCombo = state.combo + 1;
      playSound(newCombo >= 3 ? 'combo' : 'correct');
      triggerParticleAt(cardRef.current, '#10B981');
      if (newCombo >= 5) triggerGlow('#10B981');
    } else {
      playSound('wrong');
    }

    dispatch({ type: 'ANSWER', correct, word: currentWord });
  }

  function handleRetry() {
    setResult(null);
    dispatch({ type: 'RESET', words: wordSet?.words ?? [] });
  }

  if (restorePending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!wordSet || wordSet.words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[var(--color-ink-muted)]">단어가 없어요.</p>
        <Button variant="secondary" onClick={() => navigate(returnPath)}>돌아가기</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-8">
        <ResultScreen result={result} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 나가기
        </button>
        <div className="flex items-center gap-3">
          {state.round > 1 && (
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
              {state.round}라운드
            </span>
          )}
          <span className="text-[14px] font-semibold text-[var(--color-ink-muted)]">
            {state.index + 1} / {state.words.length}
          </span>
        </div>
      </div>

      <ProgressBar current={state.index} total={state.words.length} className="mb-6" />

      {currentWord && (
        <>
          {/* 스와이프 힌트 — 위 */}
          <div
            className="flex justify-center mb-3 transition-opacity duration-150"
            style={{ opacity: dragY < -20 ? Math.min(1, Math.abs(dragY) / SWIPE_THRESHOLD) : 0.25 }}
          >
            <span className="flex items-center gap-1 text-[13px] font-bold text-emerald-500">
              ↑ 알아요
            </span>
          </div>

          {/* 플래시카드 */}
          <div
            className="flex-1 flex items-center justify-center min-h-[260px]"
            style={{ perspective: '1000px' }}
          >
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { isDraggingRef.current = false; setDragY(0); }}
              ref={cardRef}
              className={cn('card-flip w-full relative cursor-grab active:cursor-grabbing select-none', state.flipped && 'flipped')}
              style={{
                minHeight: 240,
                touchAction: 'none',
                ...(dragY !== 0 && {
                  transform: `translateY(${dragY}px) rotate(${dragY * 0.03}deg)`,
                  transition: 'none',
                }),
              }}
            >
              {/* 알아요 오버레이 */}
              <div
                className="absolute inset-0 rounded-[20px] z-10 pointer-events-none flex items-center justify-center"
                style={{
                  backgroundColor: '#10B981',
                  opacity: dragY < -20 ? Math.min(0.35, Math.abs(dragY) / SWIPE_THRESHOLD * 0.35) : 0,
                  transition: isDraggingRef.current ? 'none' : 'opacity 0.2s',
                }}
              >
                <span className="text-white text-[28px] font-extrabold">알아요!</span>
              </div>
              {/* 몰라요 오버레이 */}
              <div
                className="absolute inset-0 rounded-[20px] z-10 pointer-events-none flex items-center justify-center"
                style={{
                  backgroundColor: '#EF4444',
                  opacity: dragY > 20 ? Math.min(0.35, dragY / SWIPE_THRESHOLD * 0.35) : 0,
                  transition: isDraggingRef.current ? 'none' : 'opacity 0.2s',
                }}
              >
                <span className="text-white text-[28px] font-extrabold">몰라요</span>
              </div>

              {/* 앞면 */}
              <div
                className="card-face absolute inset-0 rounded-[20px] flex flex-col items-center justify-center p-8 gap-4"
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1.5px solid ${theme.cardBorder}`,
                  boxShadow: `0 4px 20px ${theme.primary}20`,
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: theme.primary }}>단어</p>
                <p className="text-[40px] font-extrabold text-[var(--color-ink)] text-center tracking-tight">{currentWord.term}</p>
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); speak(currentWord.term); }}
                  aria-label="발음 듣기"
                  className="p-2 rounded-full text-[var(--color-ink-muted)] transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.color = theme.primary)}
                  onMouseLeave={e => (e.currentTarget.style.color = '')}
                >
                  <Volume2 size={20} />
                </button>
                <p className="text-[13px] text-[var(--color-ink-faint)]">탭하면 뒤집혀요</p>
              </div>
              {/* 뒷면 */}
              <div
                className="card-back absolute inset-0 rounded-[20px] flex flex-col items-center justify-center p-8 gap-2"
                style={{ backgroundColor: theme.cardBg, border: `2px solid ${theme.primary}` }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: theme.primary }}>뜻</p>
                <p className="text-[32px] font-bold text-[var(--color-ink)] text-center">{currentWord.definition}</p>
              </div>
            </div>
          </div>

          {/* 스와이프 힌트 — 아래 */}
          <div
            className="flex justify-center mt-3 mb-4 transition-opacity duration-150"
            style={{ opacity: dragY > 20 ? Math.min(1, dragY / SWIPE_THRESHOLD) : 0.25 }}
          >
            <span className="flex items-center gap-1 text-[13px] font-bold text-red-500">
              ↓ 몰라요
            </span>
          </div>

          {/* 라운드 2 이상일 때 남은 단어 수 안내 */}
          {state.round > 1 && (
            <p className="text-center text-[12px] text-[var(--color-ink-faint)] mb-2">
              몰라요 단어만 다시 복습 중이에요
            </p>
          )}
        </>
      )}
    </div>
  );
}
