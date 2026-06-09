import { useState, useReducer, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/games/ProgressBar';
import { ResultScreen } from '../../components/games/ResultScreen';
import { AnswerReveal } from '../../components/games/AnswerReveal';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray, generateChoices } from '../../utils/gameUtils';
import { playSound, triggerParticleAt, triggerConfetti, triggerGlow } from '../../utils/feedback';
import { THEME_PRESETS } from '../../types/word';
import { readSharedGameSession } from '../../utils/shareGame';
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
}

function init(words: Word[]): State {
  return { words: shuffleArray(words), index: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0, startTime: Date.now() };
}

type Action = { type: 'ANSWER'; correct: boolean } | { type: 'RESET'; words: Word[] };

function reducer(state: State, action: Action): State {
  if (action.type === 'RESET') return init(action.words);
  const correct  = action.correct ? state.correct + 1 : state.correct;
  const wrong    = action.correct ? state.wrong : state.wrong + 1;
  const combo    = action.correct ? state.combo + 1 : 0;
  const maxCombo = Math.max(state.maxCombo, combo);
  return { ...state, correct, wrong, combo, maxCombo, index: state.index + 1 };
}

export default function MultipleChoiceGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const theme   = wordSet ? THEME_PRESETS[wordSet.theme] : THEME_PRESETS.violet;

  const sharedQuestionType = useMemo(() => {
    if (!setId?.startsWith('_shared_')) return null;
    return readSharedGameSession()?.questionType ?? null;
  }, [setId]);

  const [questionMode, setQuestionMode] = useState<'term' | 'definition' | 'mixed' | null>(sharedQuestionType ?? null);
  const [initialState] = useState(() => init(wordSet?.words ?? []));
  const [state, dispatch] = useReducer(reducer, initialState);
  const [result, setResult] = useState<GameResult | null>(null);
  const wrongWordsRef = useRef<Word[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // 혼합 모드: 문제마다 랜덤으로 term/definition 결정 (초기화 시 고정)
  const perWordTypeRef = useRef<Array<'term' | 'definition'>>([]);
  useEffect(() => {
    if (initialState.words.length > 0) {
      perWordTypeRef.current = initialState.words.map(() =>
        Math.random() < 0.5 ? 'term' : 'definition'
      );
    }
  }, []);

  function getCurrentQType(): 'term' | 'definition' {
    if (questionMode === 'mixed') return perWordTypeRef.current[state.index] ?? 'term';
    return questionMode as 'term' | 'definition';
  }

  const [choices, setChoices] = useState<string[]>([]);
  const [revealVisible, setRevealVisible] = useState(false);
  const [revealWord, setRevealWord] = useState<Word | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentWord = state.words[state.index];

  useEffect(() => {
    if (!wordSet || !currentWord || !questionMode) return;
    setChoices(generateChoices(currentWord, wordSet.words, getCurrentQType()));
  }, [state.index, questionMode]);

  function handleSelect(choice: string) {
    if (selected || !currentWord || !wordSet) return;
    setSelected(choice);
    const qtype = getCurrentQType();
    const isCorrect = qtype === 'term'
      ? choice === currentWord.definition
      : choice === currentWord.term;
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

    const advanceDelay = isCorrect ? 700 : 2000;
    setTimeout(() => {
      const nextCorrect  = state.correct + (isCorrect ? 1 : 0);
      const nextWrong    = state.wrong   + (isCorrect ? 0 : 1);
      const nextMaxCombo = Math.max(state.maxCombo, isCorrect ? state.combo + 1 : 0);

      dispatch({ type: 'ANSWER', correct: isCorrect });
      setSelected(null);

      if (state.index + 1 >= state.words.length) {
        const gameResult: GameResult = {
          setId: wordSet.id, mode: 'multiple-choice',
          correct: nextCorrect, wrong: nextWrong,
          duration: Math.round((Date.now() - state.startTime) / 1000),
          combo: nextMaxCombo,
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
    const ns = init(wordSet.words);
    if (questionMode === 'mixed') {
      perWordTypeRef.current = ns.words.map(() => Math.random() < 0.5 ? 'term' : 'definition');
    }
    const qtype = questionMode === 'mixed' ? (perWordTypeRef.current[0] ?? 'term') : (questionMode as 'term' | 'definition');
    setResult(null);
    dispatch({ type: 'RESET', words: wordSet.words });
    setChoices(generateChoices(ns.words[0], wordSet.words, qtype));
    setSelected(null);
    setRevealVisible(false);
  }

  if (restorePending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!wordSet || wordSet.words.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <p className="text-[var(--color-ink-muted)]">4지선다 게임은 단어가 4개 이상 필요해요.</p>
        <Button variant="secondary" onClick={() => navigate(returnPath)}>돌아가기</Button>
      </div>
    );
  }

  if (result) {
    return <div className="max-w-[480px] mx-auto px-4 py-8"><ResultScreen result={result} onRetry={handleRetry} /></div>;
  }

  if (!questionMode) {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center mb-2">
          <p className="text-[24px] font-extrabold text-[var(--color-ink)] mb-2">문제 형식을 선택해주세요</p>
          <p className="text-[14px] text-[var(--color-ink-muted)]">어떤 방식으로 학습하시겠어요?</p>
        </div>
        <div className="w-full grid grid-cols-1 gap-3">
          <button
            onClick={() => setQuestionMode('term')}
            className="w-full p-6 rounded-[16px] border-2 border-[var(--color-hairline)] bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all text-left"
          >
            <p className="text-[16px] font-bold text-[var(--color-ink)] mb-1">단어를 보고 뜻 고르기</p>
            <p className="text-[13px] text-[var(--color-ink-muted)]">영단어가 나오면 한글 뜻을 선택합니다</p>
          </button>
          <button
            onClick={() => setQuestionMode('definition')}
            className="w-full p-6 rounded-[16px] border-2 border-[var(--color-hairline)] bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all text-left"
          >
            <p className="text-[16px] font-bold text-[var(--color-ink)] mb-1">뜻을 보고 단어 고르기</p>
            <p className="text-[13px] text-[var(--color-ink-muted)]">한글 뜻이 나오면 영단어를 선택합니다</p>
          </button>
          <button
            onClick={() => setQuestionMode('mixed')}
            className="w-full p-6 rounded-[16px] border-2 border-[var(--color-hairline)] bg-white hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all text-left"
          >
            <p className="text-[16px] font-bold text-[var(--color-ink)] mb-1">랜덤 혼합</p>
            <p className="text-[13px] text-[var(--color-ink-muted)]">뜻 고르기와 단어 고르기가 무작위로 섞입니다</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-1 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={16} /> 나가기
        </button>
        <div className="flex items-center gap-2">
          {state.combo >= 3 && (
            <span key={state.combo} className="text-[13px] font-bold text-[var(--color-warning)] animate-combo-spring">
              🔥×{state.combo}
            </span>
          )}
          <span className="text-[14px] font-semibold text-[var(--color-ink-muted)]">{state.index + 1} / {state.words.length}</span>
        </div>
      </div>

      <ProgressBar current={state.index} total={state.words.length} className="mb-8" />

      {currentWord && (
        <>
          <div
            ref={cardRef}
            className="rounded-[20px] p-8 mb-6 text-center"
            style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.primary}` }}
          >
            {getCurrentQType() === 'term' ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: theme.primary }}>단어</p>
                <p className="text-[40px] font-extrabold text-[var(--color-ink)] tracking-tight">{currentWord.term}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: theme.primary }}>뜻</p>
                <p className="text-[28px] font-extrabold text-[var(--color-ink)] tracking-tight">{currentWord.definition}</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice, i) => {
              const isSelected = selected === choice;
              const isCorrect  = getCurrentQType() === 'term'
                ? choice === currentWord.definition
                : choice === currentWord.term;
              return (
                <button
                  key={`${choice}-${i}`}
                  onClick={() => handleSelect(choice)}
                  disabled={!!selected}
                  className={cn(
                    'w-full p-4 rounded-[14px] border text-left text-[15px] font-semibold transition-all duration-200',
                    isSelected &&  isCorrect && 'bg-[var(--color-success)] border-[var(--color-success)] text-white animate-correct-pop',
                    isSelected && !isCorrect && 'bg-[var(--color-danger)]  border-[var(--color-danger)]  text-white animate-wrong-shake',
                    selected   && !isSelected && isCorrect  && 'bg-[var(--color-success-subtle)] border-[var(--color-success)] text-[var(--color-success)]',
                    selected   && !isSelected && !isCorrect && 'opacity-50 bg-white border-[var(--color-hairline)]',
                  )}
                  style={!selected ? { backgroundColor: 'white', borderColor: theme.cardBorder } : undefined}
                  onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.backgroundColor = theme.cardBg; } }}
                  onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.backgroundColor = 'white'; } }}
                >
                  <span className="mr-2 text-[var(--color-ink-faint)]">{String.fromCharCode(65 + i)}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          <AnswerReveal
            term={revealWord?.term ?? ''}
            definition={revealWord?.definition ?? ''}
            visible={revealVisible}
            position="top"
          />
        </>
      )}
    </div>
  );
}
