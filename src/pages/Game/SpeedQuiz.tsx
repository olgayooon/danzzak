import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ResultScreen } from '../../components/games/ResultScreen';
import { AnswerReveal } from '../../components/games/AnswerReveal';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray } from '../../utils/gameUtils';
import {
  playSound, triggerParticleAt, triggerScorePopup,
  triggerConfetti, triggerGlow,
} from '../../utils/feedback';
import { THEME_PRESETS } from '../../types/word';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

const GAME_DURATION  = 60;
const QUESTION_TIME  = 20;

export default function SpeedQuizGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const theme   = wordSet ? THEME_PRESETS[wordSet.theme] : THEME_PRESETS.violet;

  const words = useRef(shuffleArray(wordSet?.words ?? []));
  const [index,           setIndex]          = useState(0);
  const [input,           setInput]          = useState('');
  const [feedback,        setFeedback]       = useState<'correct' | 'wrong' | null>(null);
  const [gameTimeLeft,    setGameTimeLeft]   = useState(GAME_DURATION);
  const [questionTimeLeft,setQuestionTimeLeft] = useState(QUESTION_TIME);
  const [correct,         setCorrect]        = useState(0);
  const [wrong,           setWrong]          = useState(0);
  const [combo,           setCombo]          = useState(0);
  const [maxCombo,        setMaxCombo]       = useState(0);
  const [score,           setScore]          = useState(0);
  const [running,         setRunning]        = useState(false);
  const [result,          setResult]         = useState<GameResult | null>(null);
  const [revealVisible,   setRevealVisible]  = useState(false);
  const [revealWord,      setRevealWord]     = useState<Word | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const feedbackTO = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 문항 이동 중복 방지 — handleTimeout과 handleSubmit이 동시에 advance하지 못하게
  const advancingRef = useRef(false);

  const currentWord: Word | undefined = words.current[index % words.current.length];

  const endGame = useCallback((c: number, w: number, mc: number) => {
    if (feedbackTO.current) clearTimeout(feedbackTO.current);
    playSound('clear');
    triggerConfetti();
    const gameResult: GameResult = {
      setId: wordSet!.id, mode: 'speed-quiz',
      correct: c, wrong: w,
      duration: GAME_DURATION - gameTimeLeft,
      combo: mc,
      playedAt: new Date().toISOString(),
    };
    addRecord(gameResult);
    setResult(gameResult);
    setRunning(false);
  }, [wordSet, addRecord, gameTimeLeft]);

  // 전체 타이머
  useEffect(() => {
    if (!running) return;
    if (gameTimeLeft <= 0) { endGame(correct, wrong, maxCombo); return; }
    // 10초 이하 tick 사운드
    if (gameTimeLeft <= 10) playSound('tick');
    const id = setTimeout(() => setGameTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, gameTimeLeft, correct, wrong, maxCombo, endGame]);

  // 새 문항 시작 시 타이머 + advancing 플래그 리셋
  useEffect(() => {
    advancingRef.current = false;
    if (!running || !!feedback) return;
    setQuestionTimeLeft(QUESTION_TIME);
  }, [index, running]);

  // 문항 타이머 감소 — 의존성 배열 명시로 불필요한 재실행 방지
  useEffect(() => {
    if (!running || !!feedback || advancingRef.current) return;
    if (questionTimeLeft <= 0) { handleTimeout(); return; }
    const id = setTimeout(() => setQuestionTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, feedback, questionTimeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeout() {
    if (!currentWord || !running || advancingRef.current) return;
    advancingRef.current = true;
    playSound('wrong');
    setFeedback('wrong');
    updateWordStats(wordSet!.id, currentWord.id, false);
    setWrong(w => w + 1);
    setCombo(0);
    setRevealWord(currentWord);
    setRevealVisible(true);
    setTimeout(() => setRevealVisible(false), 1500);

    feedbackTO.current = setTimeout(() => {
      advancingRef.current = false;
      setFeedback(null);
      setInput('');
      setQuestionTimeLeft(QUESTION_TIME);
      setIndex(i => i + 1);
    }, 1500);
  }

  function handleSubmit() {
    if (!currentWord || !running || !!feedback || advancingRef.current) return;
    const isCorrect = input.trim().toLowerCase() === currentWord.term.trim().toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'wrong');
    updateWordStats(wordSet!.id, currentWord.id, isCorrect);

    if (isCorrect) {
      const newCombo    = combo + 1;
      const newMaxCombo = Math.max(maxCombo, newCombo);
      const points      = 10 * newCombo;
      setCombo(newCombo);
      setMaxCombo(newMaxCombo);
      setScore(s => s + points);
      setCorrect(c => c + 1);

      playSound(newCombo >= 3 ? 'combo' : 'correct');
      triggerParticleAt(cardRef.current, '#10B981');
      if (newCombo >= 5) triggerGlow('#10B981');
      // 점수 팝업
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        triggerScorePopup(r.left + r.width / 2, r.top + 20, points);
      }
    } else {
      playSound('wrong');
      setCombo(0);
      setWrong(w => w + 1);
      setRevealWord(currentWord);
      setRevealVisible(true);
      setTimeout(() => setRevealVisible(false), 1500);
    }

    advancingRef.current = true;
    const advanceDelay = isCorrect ? 400 : 1500;
    feedbackTO.current = setTimeout(() => {
      advancingRef.current = false;
      setFeedback(null);
      setInput('');
      setQuestionTimeLeft(QUESTION_TIME);
      setIndex(i => i + 1);
      inputRef.current?.focus();
    }, advanceDelay);
  }

  function handleStart() {
    words.current = shuffleArray(wordSet?.words ?? []);
    setIndex(0); setInput(''); setFeedback(null);
    setGameTimeLeft(GAME_DURATION); setQuestionTimeLeft(QUESTION_TIME);
    setCorrect(0); setWrong(0); setCombo(0); setMaxCombo(0); setScore(0);
    setResult(null); setRevealVisible(false);
    setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
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
        <div className="text-center mb-4">
          <p className="text-[13px] text-[var(--color-ink-muted)]">최종 점수</p>
          <p className="text-[48px] font-extrabold" style={{ color: theme.primary }}>{score}</p>
        </div>
        <ResultScreen result={result} onRetry={handleStart} />
      </div>
    );
  }

  if (!running) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <p className="text-[40px] mb-2">🚀</p>
          <h1 className="text-[26px] font-extrabold text-[var(--color-ink)] mb-2">스피드 퀴즈</h1>
          <p className="text-[15px] text-[var(--color-ink-muted)]">
            {GAME_DURATION}초 안에 최대한 많은 단어를 맞춰요<br />
            연속 정답 시 콤보 보너스!
          </p>
        </div>
        <Button size="lg" onClick={handleStart}>게임 시작</Button>
      </div>
    );
  }

  if (!currentWord) return null;

  // 타이머 긴장감 스타일
  const timerColor =
    gameTimeLeft > 30 ? 'var(--color-ink)'
    : gameTimeLeft > 10 ? 'var(--color-warning)'
    : 'var(--color-danger)';
  const timerDanger = gameTimeLeft <= 10;
  const questionPct = (questionTimeLeft / QUESTION_TIME) * 100;
  const gamePct     = (gameTimeLeft / GAME_DURATION) * 100;

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(returnPath)} className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
          <ArrowLeft size={15} /> 나가기
        </button>
        <div className="flex items-center gap-3 text-[14px]">
          <span className={cn('font-bold tabular-nums', timerDanger && 'animate-pulse-danger')} style={{ color: timerColor }}>
            {gameTimeLeft}초
          </span>
          <span className="font-bold text-[var(--color-ink)]">{score}점</span>
          {combo >= 3 && (
            <span key={combo} className="font-bold text-[var(--color-warning)] flex items-center gap-1 animate-combo-spring">
              <Zap size={14} />×{combo}
            </span>
          )}
        </div>
      </div>

      {/* 전체 타이머 바 */}
      <div className="h-1.5 rounded-full bg-[var(--color-hairline)] mb-1 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${gamePct}%`, backgroundColor: timerDanger ? 'var(--color-danger)' : theme.primary }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--color-ink-muted)] mb-5">
        <span>남은 시간</span>
        <span>{correct}개 정답</span>
      </div>

      {/* 문항 카드 */}
      <div
        ref={cardRef}
        className="rounded-[20px] p-8 text-center mb-6"
        style={{ backgroundColor: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-3" style={{ color: theme.primary }}>뜻</p>
        <p className="text-[22px] font-bold text-[var(--color-ink)] leading-snug">{currentWord.definition}</p>
      </div>

      {/* 문항 타이머 바 */}
      <div className="h-1 rounded-full bg-[var(--color-hairline)] mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${questionPct}%`, backgroundColor: questionTimeLeft <= 2 ? 'var(--color-danger)' : 'var(--color-success)' }}
        />
      </div>

      {/* 입력 */}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="영단어 입력 후 Enter"
        readOnly={!!feedback}
        className={cn(
          'w-full border-2 rounded-[12px] px-4 py-3 text-[18px] font-semibold outline-none transition-all text-center',
          feedback === 'correct' && 'border-[var(--color-success)] bg-[var(--color-success-subtle)] text-[var(--color-success)] animate-correct-pop',
          feedback === 'wrong'   && 'border-[var(--color-danger)]  bg-[var(--color-danger-subtle)]  text-[var(--color-danger)]  animate-wrong-shake',
          !feedback && 'border-[var(--color-hairline)] bg-white',
        )}
        style={!feedback ? { borderColor: theme.primary } : {}}
      />

      <AnswerReveal
        term={revealWord?.term ?? ''}
        definition={revealWord?.definition ?? ''}
        visible={revealVisible}
        position="top"
      />
    </div>
  );
}
