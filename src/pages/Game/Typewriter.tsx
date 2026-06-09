import { useState, useReducer, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/games/ProgressBar';
import { ResultScreen } from '../../components/games/ResultScreen';
import { AnswerReveal } from '../../components/games/AnswerReveal';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray } from '../../utils/gameUtils';
import { playSound, triggerParticleAt, triggerConfetti, triggerGlow } from '../../utils/feedback';
import { THEME_PRESETS } from '../../types/word';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

type Phase = 'exposing' | 'typing' | 'feedback' | 'done';

interface State {
  words: Word[];
  index: number;
  phase: Phase;
  input: string;
  score: number;
  correct: number;
  wrong: number;
  combo: number;
  maxCombo: number;
  startTime: number;
  hintUsed: boolean;
}

type Action =
  | { type: 'START_TYPING'; exposeDuration: number }
  | { type: 'SET_INPUT'; value: string }
  | { type: 'SUBMIT'; isCorrect: boolean }
  | { type: 'USE_HINT' }
  | { type: 'NEXT_WORD' }
  | { type: 'END'; words: Word[] }
  | { type: 'RESET'; words: Word[] };

const EXPOSE_DURATION = { easy: 3000, normal: 2000, hard: 1000 } as const;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_TYPING':
      return { ...state, phase: 'typing' };
    case 'SET_INPUT':
      return { ...state, input: action.value };
    case 'SUBMIT': {
      const currentWord = state.words[state.index];
      if (!currentWord) return state;

      const newCombo = action.isCorrect ? state.combo + 1 : 0;
      const newMaxCombo = Math.max(state.maxCombo, newCombo);
      const newScore = action.isCorrect
        ? state.score + (state.hintUsed ? 50 : 100)
        : state.score;

      return {
        ...state,
        phase: 'feedback',
        score: newScore,
        correct: action.isCorrect ? state.correct + 1 : state.correct,
        wrong: action.isCorrect ? state.wrong : state.wrong + 1,
        combo: newCombo,
        maxCombo: newMaxCombo,
      };
    }
    case 'USE_HINT':
      return { ...state, hintUsed: true };
    case 'NEXT_WORD': {
      const nextIdx = state.index + 1;
      if (nextIdx >= state.words.length) {
        return { ...state, phase: 'done' };
      }
      return {
        ...state,
        index: nextIdx,
        phase: 'exposing',
        input: '',
        hintUsed: false,
      };
    }
    case 'END':
      return {
        ...state,
        words: action.words,
        index: 0,
        phase: 'exposing',
        input: '',
        score: 0,
        correct: 0,
        wrong: 0,
        combo: 0,
        maxCombo: 0,
        startTime: Date.now(),
        hintUsed: false,
      };
    case 'RESET':
      return {
        words: shuffleArray(action.words),
        index: 0,
        phase: 'exposing',
        input: '',
        score: 0,
        correct: 0,
        wrong: 0,
        combo: 0,
        maxCombo: 0,
        startTime: Date.now(),
        hintUsed: false,
      };
    default:
      return state;
  }
}

export default function TypewriterGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const theme = wordSet ? THEME_PRESETS[wordSet.theme] : THEME_PRESETS.violet;
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [state, dispatch] = useReducer(reducer, wordSet?.words ?? [], s => ({
    words: shuffleArray(s),
    index: 0,
    phase: 'exposing' as Phase,
    input: '',
    score: 0,
    correct: 0,
    wrong: 0,
    combo: 0,
    maxCombo: 0,
    startTime: Date.now(),
    hintUsed: false,
  }));
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [exposing, setExposing] = useState(true);
  const [revealVisible, setRevealVisible] = useState(false);
  const [revealWord, setRevealWord] = useState<Word | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const exposeDurationRef = useRef(EXPOSE_DURATION[difficulty]);

  const currentWord = state.words[state.index];

  // 단어 노출 타이머
  useEffect(() => {
    if (state.phase !== 'exposing' || !exposing) return;
    const id = setTimeout(() => {
      setExposing(false);
      dispatch({ type: 'START_TYPING', exposeDuration: exposeDurationRef.current });
      setTimeout(() => inputRef.current?.focus(), 50);
    }, exposeDurationRef.current);
    return () => clearTimeout(id);
  }, [state.phase, exposing]);

  // 게임 종료 감지
  useEffect(() => {
    if (state.phase === 'done' && !result && wordSet) {
      const gameResult: GameResult = {
        setId: wordSet.id,
        mode: 'typewriter',
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

  const handleSubmit = useCallback(() => {
    if (!currentWord || state.phase !== 'typing') return;
    const isCorrect = state.input.toLowerCase().trim() === currentWord.term.toLowerCase().trim();
    updateWordStats(wordSet!.id, currentWord.id, isCorrect);

    if (isCorrect) {
      playSound(state.combo >= 2 ? 'combo' : 'correct');
      triggerParticleAt(inputRef.current, '#10B981');
      if (state.combo + 1 >= 5) triggerGlow('#10B981');
    } else {
      playSound('wrong');
      setRevealWord(currentWord);
      setRevealVisible(true);
      setTimeout(() => setRevealVisible(false), 2000);
    }

    dispatch({ type: 'SUBMIT', isCorrect });
    setTimeout(() => {
      setExposing(true);
      setRevealVisible(false);
      dispatch({ type: 'NEXT_WORD' });
    }, isCorrect ? 300 : 2000);
  }, [currentWord, state, updateWordStats, wordSet]);

  const handleHint = useCallback(() => {
    if (state.hintUsed || state.phase !== 'typing') return;
    dispatch({ type: 'USE_HINT' });
    if (currentWord) {
      dispatch({ type: 'SET_INPUT', value: currentWord.term.charAt(0) });
      inputRef.current?.focus();
    }
  }, [state.hintUsed, state.phase, currentWord]);

  const renderCharacterFeedback = () => {
    if (state.phase !== 'typing' || !currentWord) return null;
    const correct = currentWord.term.toLowerCase();
    return (
      <div className="flex justify-center gap-1 mb-4">
        {correct.split('').map((char, i) => {
          const inputChar = state.input.toLowerCase()[i];
          const isCorrectChar = inputChar === char;
          const isWrongChar = inputChar && inputChar !== char;
          return (
            <div
              key={i}
              className={cn('w-8 h-8 flex items-center justify-center text-sm font-bold rounded', {
                'bg-[var(--color-success)] text-white': isCorrectChar,
                'bg-[var(--color-danger)] text-white': isWrongChar,
                'bg-[var(--color-hairline)]': !inputChar,
              })}
            >
              {isCorrectChar || isWrongChar ? (inputChar || char) : ''}
            </div>
          );
        })}
      </div>
    );
  };

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
        <ResultScreen result={result} onRetry={() => { setResult(null); setGameStarted(false); }} />
      </div>
    );
  }

  if (!currentWord) return null;

  // 난이도 선택 화면
  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <p className="text-[40px] mb-2">⌨️</p>
          <h1 className="text-[26px] font-extrabold text-[var(--color-ink)] mb-2">타이핑 암기</h1>
          <p className="text-[15px] text-[var(--color-ink-muted)] mb-6">
            사라진 단어를 기억하고 타이핑하세요
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          {(['easy', 'normal', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                exposeDurationRef.current = EXPOSE_DURATION[d];
                setGameStarted(true);
              }}
              className={cn(
                'px-6 py-3 rounded-full font-bold text-[15px] transition-all',
                difficulty === d
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-hairline)] text-[var(--color-ink)]',
              )}
            >
              {d === 'easy' ? '쉬움(3초)' : d === 'normal' ? '보통(2초)' : '어려움(1초)'}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
      <div className="mb-6 p-4 rounded-[14px] bg-[var(--color-hairline)]">
        <p className="text-[18px] font-semibold text-[var(--color-ink)] text-center">{currentWord.definition}</p>
      </div>

      {/* 단어 영역 */}
      <div className="flex-1 flex items-center justify-center mb-6">
        {exposing ? (
          <p className="text-[48px] font-extrabold text-[var(--color-ink)] text-center tracking-tight">
            {currentWord.term}
          </p>
        ) : (
          <p className="text-[32px] font-bold text-[var(--color-ink-muted)] tracking-widest">
            {currentWord.term.split('').map(() => '_').join(' ')}
          </p>
        )}
      </div>

      {/* 실시간 피드백 */}
      {renderCharacterFeedback()}

      {/* 입력창 */}
      <div className="mb-4">
        <input
          ref={inputRef}
          value={state.input}
          onChange={e => dispatch({ type: 'SET_INPUT', value: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && state.phase === 'typing' && handleSubmit()}
          placeholder={state.phase === 'typing' ? '타이핑하세요' : '단어를 보고 있어요...'}
          disabled={state.phase !== 'typing'}
          className={cn(
            'w-full border-2 rounded-[12px] px-4 py-3 text-[18px] font-semibold outline-none transition-all text-center',
            state.phase === 'typing' && 'border-[var(--color-primary)] bg-white',
            state.phase !== 'typing' && 'border-[var(--color-hairline)] bg-[var(--color-hairline)] text-[var(--color-ink-muted)]',
          )}
        />
      </div>

      {/* 힌트 + 제출 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleHint}
          disabled={state.hintUsed || state.phase !== 'typing'}
          className="px-4 py-2 rounded-[10px] bg-[var(--color-warning-subtle)] text-[var(--color-warning)] font-semibold text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          💡 힌트 {state.hintUsed ? '(사용함)' : ''}
        </button>
        <button
          onClick={handleSubmit}
          disabled={state.phase !== 'typing' || !state.input.trim()}
          className="flex-1 py-3 rounded-full bg-[var(--color-primary)] text-white font-bold text-[15px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>

      <AnswerReveal
        term={revealWord?.term ?? ''}
        definition={revealWord?.definition ?? ''}
        visible={revealVisible}
        position="top"
      />

      <div className="text-center text-[12px] text-[var(--color-ink-muted)]">
        <p>점수: {state.score}점 | {state.correct}개 정답</p>
      </div>
    </div>
  );
}
