import { useState, useReducer, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/games/ProgressBar';
import { ResultScreen } from '../../components/games/ResultScreen';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray } from '../../utils/gameUtils';
import { playSound, triggerConfetti, triggerGlow } from '../../utils/feedback';
import { getTheme } from '../../types/word';
import { useIsDark } from '../../hooks/useIsDark';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

type Phase = 'playing' | 'feedback' | 'done';

interface State {
  words: Word[];
  index: number;
  phase: Phase;
  missingIndices: number[];
  inputs: Map<number, string>;
  score: number;
  correct: number;
  wrong: number;
  correctStreak: Map<string, number>;
  combo: number;
  maxCombo: number;
  startTime: number;
}

type Action =
  | { type: 'SET_INPUT'; index: number; value: string }
  | { type: 'SUBMIT'; isCorrect: boolean }
  | { type: 'NEXT_WORD' }
  | { type: 'END' }
  | { type: 'RESET'; words: Word[] };

const VOWELS = 'aeiou';

function getMissingCount(word: Word): number {
  const len = word.term.length;
  const total = word.stats.correct + word.stats.wrong || 1;
  const wrongRate = word.stats.wrong / total;
  let base = Math.floor(len * 0.3);
  if (wrongRate > 0.5) base = Math.floor(len * 0.5);
  else if (wrongRate > 0.3) base = Math.floor(len * 0.4);
  return Math.max(1, Math.min(base + 1, len - 1));
}

function getMissingIndices(term: string, count: number): number[] {
  const indices = new Set<number>();
  const termLower = term.toLowerCase();

  // 모음 우선
  for (let i = 1; i < term.length && indices.size < count; i++) {
    if (VOWELS.includes(termLower[i])) indices.add(i);
  }

  // 모음 부족하면 자음 추가
  for (let i = 1; i < term.length && indices.size < count; i++) {
    if (!VOWELS.includes(termLower[i])) indices.add(i);
  }

  return Array.from(indices).sort((a, b) => a - b);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INPUT':
      state.inputs.set(action.index, action.value.toUpperCase().slice(0, 1));
      return { ...state };
    case 'SUBMIT': {
      const currentWord = state.words[state.index];
      if (!currentWord) return state;

      const newCombo = action.isCorrect ? state.combo + 1 : 0;
      const newMaxCombo = Math.max(state.maxCombo, newCombo);
      const missingCount = state.missingIndices.length;
      const points = action.isCorrect ? 100 + missingCount * 20 : 0;

      if (action.isCorrect) {
        const streak = (state.correctStreak.get(currentWord.id) || 0) + 1;
        state.correctStreak.set(currentWord.id, streak);
      } else {
        state.correctStreak.delete(currentWord.id);
      }

      return {
        ...state,
        phase: 'feedback',
        score: state.score + points,
        correct: action.isCorrect ? state.correct + 1 : state.correct,
        wrong: action.isCorrect ? state.wrong : state.wrong + 1,
        combo: newCombo,
        maxCombo: newMaxCombo,
      };
    }
    case 'NEXT_WORD': {
      const nextIdx = state.index + 1;
      if (nextIdx >= state.words.length) {
        return { ...state, phase: 'done' };
      }
      const nextWord = state.words[nextIdx];
      const missingCount = getMissingCount(nextWord);
      const missingIndices = getMissingIndices(nextWord.term, missingCount);
      return {
        ...state,
        index: nextIdx,
        phase: 'playing',
        missingIndices,
        inputs: new Map(),
      };
    }
    case 'END':
      return state;
    case 'RESET': {
      const words = shuffleArray(action.words);
      const firstWord = words[0];
      const missingCount = getMissingCount(firstWord);
      const missingIndices = getMissingIndices(firstWord.term, missingCount);
      return {
        words,
        index: 0,
        phase: 'playing',
        missingIndices,
        inputs: new Map(),
        score: 0,
        correct: 0,
        wrong: 0,
        correctStreak: new Map(),
        combo: 0,
        maxCombo: 0,
        startTime: Date.now(),
      };
    }
    default:
      return state;
  }
}

export default function MissingLettersGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const isDark = useIsDark();
  const theme = getTheme(wordSet?.theme ?? 'violet', isDark);

  const initialState = wordSet?.words ? (() => {
    const words = shuffleArray(wordSet.words);
    const firstWord = words[0];
    const missingCount = getMissingCount(firstWord);
    const missingIndices = getMissingIndices(firstWord.term, missingCount);
    return {
      words,
      index: 0,
      phase: 'playing' as Phase,
      missingIndices,
      inputs: new Map<number, string>(),
      score: 0,
      correct: 0,
      wrong: 0,
      correctStreak: new Map<string, number>(),
      combo: 0,
      maxCombo: 0,
      startTime: Date.now(),
    };
  })() : {
    words: [],
    index: 0,
    phase: 'playing' as Phase,
    missingIndices: [],
    inputs: new Map<number, string>(),
    score: 0,
    correct: 0,
    wrong: 0,
    correctStreak: new Map<string, number>(),
    combo: 0,
    maxCombo: 0,
    startTime: Date.now(),
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [result, setResult] = useState<GameResult | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const currentWord = state.words[state.index];

  // 문제 바뀔 때 첫 번째 빈칸에 자동 포커스
  useEffect(() => {
    if (state.phase !== 'playing' || state.missingIndices.length === 0) return;
    setTimeout(() => inputRefs.current.get(state.missingIndices[0])?.focus(), 50);
  }, [state.index, state.phase]);

  useEffect(() => {
    if (state.phase === 'done' && !result && wordSet) {
      const gameResult: GameResult = {
        setId: wordSet.id,
        mode: 'missing-letters',
        correct: state.correct,
        wrong: state.wrong,
        duration: Math.round((Date.now() - state.startTime) / 1000),
        combo: state.maxCombo,
        score: state.score,
        playedAt: new Date().toISOString(),
      };
      playSound('clear');
      triggerConfetti();
      addRecord(gameResult);
      setResult(gameResult);
    }
  }, [state.phase, state.correct, state.wrong, state.maxCombo, state.startTime, state.score]);

  const handleSubmit = useCallback((pendingInput?: { index: number; value: string }) => {
    if (!currentWord || state.phase !== 'playing') return;

    const getInput = (idx: number) =>
      (pendingInput?.index === idx ? pendingInput.value : state.inputs.get(idx))?.toLowerCase();

    const isCorrect = state.missingIndices.every(idx =>
      getInput(idx) === currentWord.term[idx].toLowerCase()
    );

    const wrong = new Set<number>();
    if (!isCorrect) {
      state.missingIndices.forEach(idx => {
        if (getInput(idx) !== currentWord.term[idx].toLowerCase()) wrong.add(idx);
      });
      setWrongIndices(wrong);
    }

    updateWordStats(wordSet!.id, currentWord.id, isCorrect);

    if (isCorrect) {
      playSound(state.combo >= 2 ? 'combo' : 'correct');
      if (state.combo + 1 >= 5) triggerGlow('#10B981');
    } else {
      playSound('wrong');
    }

    dispatch({ type: 'SUBMIT', isCorrect });

    setTimeout(() => {
      setWrongIndices(new Set());
      dispatch({ type: 'NEXT_WORD' });
    }, isCorrect ? 300 : 800);
  }, [currentWord, state, updateWordStats, wordSet]);

  const handleInputChange = useCallback((idx: number, value: string) => {
    dispatch({ type: 'SET_INPUT', index: idx, value });
    if (value) {
      const nextMissing = state.missingIndices[state.missingIndices.indexOf(idx) + 1];
      if (nextMissing !== undefined) {
        setTimeout(() => inputRefs.current.get(nextMissing)?.focus(), 50);
      } else {
        handleSubmit({ index: idx, value });
      }
    }
  }, [state.missingIndices, handleSubmit]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !state.inputs.get(idx)) {
      const currentMissingIdx = state.missingIndices.indexOf(idx);
      if (currentMissingIdx > 0) {
        const prevMissing = state.missingIndices[currentMissingIdx - 1];
        inputRefs.current.get(prevMissing)?.focus();
      }
    }
  }, [state.inputs, state.missingIndices]);

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
        <div className="text-center mb-4">
          <p className="text-[13px] text-[var(--color-ink-muted)]">최종 점수</p>
          <p className="text-[48px] font-extrabold" style={{ color: theme.primary }}>{state.score}</p>
        </div>
        <ResultScreen result={result} onRetry={() => { setResult(null); dispatch({ type: 'RESET', words: wordSet.words }); }} />
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
          <ArrowLeft size={15} /> 나가기
        </button>
        <span className="text-[13px] font-semibold text-[var(--color-ink-muted)]">
          {state.index + 1} / {state.words.length}
        </span>
      </div>

      <ProgressBar current={state.index} total={state.words.length} className="mb-6" />

      {/* 뜻 표시 */}
      <div className="mb-8 p-4 rounded-[14px] bg-[var(--color-hairline)]">
        <p className="text-[18px] font-semibold text-[var(--color-ink)] text-center">{currentWord.definition}</p>
      </div>

      {/* 빈칸 채우기 */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <div className="flex flex-wrap gap-2 justify-center font-mono text-[28px] font-bold">
          {currentWord.term.split('').map((char, idx) => {
            const isMissing = state.missingIndices.includes(idx);
            const isWrong = wrongIndices.has(idx);

            if (!isMissing) {
              return (
                <div key={idx} className="text-[var(--color-ink)]">
                  {char}
                </div>
              );
            }

            return (
              <input
                key={idx}
                ref={el => { if (el) inputRefs.current.set(idx, el); }}
                value={state.inputs.get(idx) || ''}
                onChange={e => handleInputChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                placeholder="_"
                disabled={state.phase !== 'playing'}
                maxLength={1}
                className={cn(
                  'w-8 h-10 text-center font-mono text-[24px] font-bold border-2 rounded outline-none transition-all',
                  state.phase !== 'playing' && 'cursor-not-allowed',
                  isWrong && state.phase === 'feedback'
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                    : 'border-[var(--color-primary)] bg-[var(--color-surface)]',
                )}
              />
            );
          })}
        </div>
      </div>

      {/* 제출 버튼 */}
      {state.phase === 'playing' && (
        <button
          onClick={() => handleSubmit()}
          disabled={state.missingIndices.some(idx => !state.inputs.get(idx))}
          className="w-full py-3 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          확인
        </button>
      )}

      <div className="text-center text-[12px] text-[var(--color-ink-muted)] mt-4">
        <p>점수: {state.score}점 | {state.correct}개 정답</p>
      </div>
    </div>
  );
}
