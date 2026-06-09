import { useState, useReducer, useRef, useEffect } from 'react';
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
import { getTheme } from '../../types/word';
import { useIsDark } from '../../hooks/useIsDark';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

interface State {
  words: Word[];
  index: number;
  correct: number;
  wrong: number;
  combo: number;
  maxCombo: number;
  startTime: number;
  done: boolean;
}

function init(words: Word[]): State {
  return { words: shuffleArray(words), index: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, startTime: Date.now(), done: false };
}

type Action = { type: 'ANSWER'; correct: boolean } | { type: 'RESET'; words: Word[] };

function reducer(state: State, action: Action): State {
  if (action.type === 'RESET') return init(action.words);
  const correct  = action.correct ? state.correct + 1 : state.correct;
  const wrong    = action.correct ? state.wrong : state.wrong + 1;
  const combo    = action.correct ? state.combo + 1 : 0;
  const maxCombo = Math.max(state.maxCombo, combo);
  const nextIndex = state.index + 1;
  return { ...state, correct, wrong, combo, maxCombo, index: nextIndex, done: nextIndex >= state.words.length };
}

export default function FillInGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const isDark = useIsDark();
  const theme = getTheme(wordSet?.theme ?? 'violet', isDark);
  const [state, dispatch] = useReducer(reducer, wordSet?.words ?? [], init);
  const [result, setResult] = useState<GameResult | null>(null);
  const wrongWordsRef = useRef<Word[]>([]);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealVisible, setRevealVisible] = useState(false);
  const [revealWord, setRevealWord] = useState<Word | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  const currentWord = state.words[state.index];

  useEffect(() => { inputRef.current?.focus(); }, [state.index]);

  function handleSubmit() {
    if (!currentWord || !wordSet || feedback) return;
    const normalize = (s: string) => s.trim().toLowerCase();
    const isCorrect = normalize(input) === normalize(currentWord.term);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateWordStats(wordSet.id, currentWord.id, isCorrect);

    if (isCorrect) {
      playSound(state.combo >= 2 ? 'combo' : 'correct');
      triggerParticleAt(cardRef.current, '#10B981');
      if (state.combo + 1 >= 5) triggerGlow('#10B981');
    } else {
      playSound('wrong');
      setRevealWord(currentWord);
      setRevealVisible(true);
      if (!wrongWordsRef.current.find(w => w.id === currentWord.id)) {
        wrongWordsRef.current = [...wrongWordsRef.current, currentWord];
      }
      setTimeout(() => setRevealVisible(false), 2000);
    }

    const advanceDelay = isCorrect ? 800 : 2000;
    setTimeout(() => {
      setFeedback(null);
      setInput('');
      const nextIdx = state.index + 1;
      dispatch({ type: 'ANSWER', correct: isCorrect });

      if (nextIdx >= state.words.length) {
        const gameResult: GameResult = {
          setId: wordSet.id, mode: 'fill-in',
          correct: state.correct + (isCorrect ? 1 : 0),
          wrong:   state.wrong   + (isCorrect ? 0 : 1),
          duration: Math.round((Date.now() - state.startTime) / 1000),
          combo: Math.max(state.maxCombo, isCorrect ? state.combo + 1 : 0),
          playedAt: new Date().toISOString(),
          wrongWords: wrongWordsRef.current,
        };
        playSound('clear');
        triggerConfetti();
        addRecord(gameResult);
        setResult(gameResult);
      }
    }, advanceDelay);
  }

  function handleRetry() {
    if (!wordSet) return;
    wrongWordsRef.current = [];
    setResult(null);
    dispatch({ type: 'RESET', words: wordSet.words });
    setInput('');
    setFeedback(null);
    setRevealVisible(false);
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
        <Button variant="secondary" onClick={() => navigate(returnPath)}>돌아가기</Button>
      </div>
    );
  }

  if (result) {
    return <div className="max-w-[480px] mx-auto px-4 py-8"><ResultScreen result={result} onRetry={handleRetry} /></div>;
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 나가기
        </button>
        <div className="flex items-center gap-2">
          {state.combo >= 3 && (
            <span
              key={state.combo}
              className="text-[13px] font-bold text-[var(--color-warning)] animate-combo-spring"
            >
              🔥×{state.combo}
            </span>
          )}
          <span className="text-[14px] font-semibold text-[var(--color-ink-muted)]">{state.index + 1} / {state.words.length}</span>
        </div>
      </div>

      <ProgressBar current={state.index} total={state.words.length} className="mb-8" />

      {currentWord && (
        <div className="flex flex-col gap-6">
          <div
            ref={cardRef}
            className="rounded-[20px] p-8 text-center"
            style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.primary}` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: theme.primary }}>뜻</p>
            <p className="text-[28px] font-bold text-[var(--color-ink)]">{currentWord.definition}</p>
          </div>

          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="영단어를 입력하세요"
              readOnly={!!feedback}
              style={!feedback ? { borderColor: theme.primary } : undefined}
              className={cn(
                'w-full bg-[var(--color-surface)] border-2 rounded-[14px] px-4 py-4 text-[20px] font-semibold text-center outline-none transition-all',
                feedback === 'correct' && 'border-[var(--color-success)] bg-[var(--color-success-subtle)] text-[var(--color-success)] animate-correct-pop',
                feedback === 'wrong'   && 'border-[var(--color-danger)]  bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]  animate-wrong-shake',
              )}
            />
            <AnswerReveal
              term={revealWord?.term ?? ''}
              definition={revealWord?.definition ?? ''}
              visible={revealVisible}
              position="inline"
            />
            <button
              className="w-full py-3.5 rounded-full text-[16px] font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: theme.primary }}
              onClick={handleSubmit}
              disabled={!input.trim() || !!feedback}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
