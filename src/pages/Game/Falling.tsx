import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ResultScreen } from '../../components/games/ResultScreen';
import { FallingCard } from './FallingCard';
import { FallingInput } from './FallingInput';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { shuffleArray, generateTermChoices } from '../../utils/gameUtils';
import { playSound, triggerConfetti, triggerGlow } from '../../utils/feedback';
import { THEME_PRESETS } from '../../types/word';
import type { GameResult } from '../../types/game';
import type { Word } from '../../types/word';
import { cn } from '../../utils/cn';

const MAX_LIVES = 3;
const LEVEL_UP_EVERY = 5;

const isMobile = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function FallingGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, updateWordStats, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const theme = wordSet ? THEME_PRESETS[wordSet.theme] : THEME_PRESETS.violet;
  const [mobile] = useState(isMobile);

  // ── 게임 상태 ──────────────────────────────────────────────────
  const words = useRef<Word[]>([]);
  const startTimeRef = useRef(0);

  const [wordIndex, setWordIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [level, setLevel] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wrongKey, setWrongKey] = useState(0);
  const [correctFeedback, setCorrectFeedback] = useState(false);
  const [wrongChoiceId, setWrongChoiceId] = useState<string | null>(null);
  const [revealVisible, setRevealVisible] = useState(false);
  const [revealY, setRevealY] = useState(0);
  const [revealWord, setRevealWord] = useState<Word | null>(null);
  const lastCardY = useRef(0); // FallingCard가 매 프레임 업데이트하는 Y 위치
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);

  /**
   * 낙하 루프를 멈추기 위한 신호 ref.
   * true로 설정하면 FallingCard의 RAF tick이 다음 프레임에서 조용히 종료.
   * ref이므로 값 변경 시 리렌더링 없음.
   */
  const stopRef = useRef(false);
  const arenaRef = useRef<HTMLDivElement>(null);

  const currentWord: Word | undefined = words.current[wordIndex];

  const mobileChoices = useMemo(
    () => currentWord ? generateTermChoices(currentWord, words.current) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wordIndex, running], // running 포함: 게임 시작 시 words.current(ref) 변경 감지
  );

  // ── 게임 종료 ──────────────────────────────────────────────────
  const endGame = useCallback((
    finalCorrect: number,
    finalWrong: number,
    finalMaxCombo: number,
  ) => {
    stopRef.current = true;
    playSound('clear');
    triggerConfetti();
    const gameResult: GameResult = {
      setId: wordSet!.id,
      mode: 'falling',
      correct: finalCorrect,
      wrong: finalWrong,
      duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      combo: finalMaxCombo,
      playedAt: new Date().toISOString(),
    };
    addRecord(gameResult);
    setResult(gameResult);
    setRunning(false);
  }, [wordSet, addRecord]);

  // ── 다음 단어로 이동 ───────────────────────────────────────────
  const goNext = useCallback((
    isCorrect: boolean,
    snap: { lives: number; correct: number; wrong: number; combo: number; maxCombo: number },
  ) => {
    const newCorrect  = isCorrect ? snap.correct + 1  : snap.correct;
    const newWrong    = isCorrect ? snap.wrong         : snap.wrong + 1;
    const newCombo    = isCorrect ? snap.combo + 1     : snap.combo;
    const newMaxCombo = Math.max(snap.maxCombo, newCombo);
    const newLives    = isCorrect ? snap.lives          : snap.lives - 1;
    const newLevel    = Math.min(5, Math.floor(newCorrect / LEVEL_UP_EVERY) + 1);
    const nextIdx     = wordIndex + 1;

    setCorrect(newCorrect);
    setWrong(newWrong);
    setCombo(newCombo);
    setMaxCombo(newMaxCombo);
    setLives(newLives);
    setLevel(newLevel);

    if (newLives <= 0 || nextIdx >= words.current.length) {
      endGame(newCorrect, newWrong, newMaxCombo);
      return;
    }

    // 정답이면 잠깐 feedback 표시 후 다음 단어
    const delay = isCorrect ? 400 : 0;
    setTimeout(() => {
      stopRef.current = false;   // 새 단어에서 RAF 재시작 허용
      setCorrectFeedback(false);
      setWordIndex(nextIdx);     // key 변경 → FallingCard remount → RAF 재시작
    }, delay);
  }, [wordIndex, endGame]);

  // ── 정답 판정 ──────────────────────────────────────────────────
  const handleSubmit = useCallback((answer: string) => {
    if (!currentWord || !running || stopRef.current) return;

    const isCorrect = answer.toLowerCase().trim() === currentWord.term.toLowerCase().trim();
    updateWordStats(wordSet!.id, currentWord.id, isCorrect);

    if (isCorrect) {
      stopRef.current = true;
      setCorrectFeedback(true);
      playSound(combo >= 2 ? 'combo' : 'correct');
      if (combo + 1 >= 5) triggerGlow('#10B981');
      goNext(true, { lives, correct, wrong, combo, maxCombo });
    } else {
      // 카드를 현재 위치에서 멈추고 정답 표시
      stopRef.current = true;
      playSound('wrong');
      setWrongKey(k => k + 1);
      setWrongChoiceId(answer);
      setRevealWord(currentWord);
      setRevealY(lastCardY.current);
      setRevealVisible(true);
      setTimeout(() => {
        setWrongChoiceId(null);
        setRevealVisible(false);
        goNext(false, { lives, correct, wrong, combo, maxCombo });
      }, 1800);
    }
  }, [currentWord, running, updateWordStats, wordSet, goNext, lives, correct, wrong, combo, maxCombo]);

  // ── 바닥 도달 (목숨 차감) ──────────────────────────────────────
  const handleMiss = useCallback(() => {
    if (!currentWord || !running) return;
    updateWordStats(wordSet!.id, currentWord.id, false);
    playSound('wrong');
    setRevealWord(currentWord);
    setRevealY(lastCardY.current);
    setRevealVisible(true);
    // goNext를 지연시켜 리빌이 보이는 동안 다음 단어로 넘어가지 않음
    setTimeout(() => {
      setRevealVisible(false);
      goNext(false, { lives, correct, wrong, combo, maxCombo });
    }, 1500);
  }, [currentWord, running, updateWordStats, wordSet, goNext, lives, correct, wrong, combo, maxCombo]);

  // ── 게임 시작 / 재시작 ────────────────────────────────────────
  function startGame() {
    words.current = shuffleArray(wordSet?.words ?? []);
    startTimeRef.current = Date.now();
    stopRef.current = false;
    setWordIndex(0);
    setLives(MAX_LIVES);
    setLevel(1);
    setCorrect(0);
    setWrong(0);
    setCombo(0);
    setMaxCombo(0);
    setWrongKey(0);
    setCorrectFeedback(false);
    setRevealVisible(false);
    setResult(null);
    setRunning(true);
  }

  // ── 가드 ──────────────────────────────────────────────────────
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
    return <div className="max-w-[480px] mx-auto px-4 py-8"><ResultScreen result={result} onRetry={startGame} /></div>;
  }

  if (!running) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <p className="text-[40px] mb-2">⚡</p>
          <h1 className="text-[26px] font-extrabold text-[var(--color-ink)] mb-2">크래싱</h1>
          <p className="text-[15px] text-[var(--color-ink-muted)]">
            {mobile ? '떨어지는 단어의 뜻을 탭하세요' : '뜻을 보고 영단어를 입력하세요'}<br />
            바닥에 닿기 전에 맞춰야 해요 · 목숨 {MAX_LIVES}개
          </p>
        </div>
        <Button size="lg" onClick={startGame}>
          게임 시작
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* HUD */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <button
          onClick={() => navigate(returnPath)}
          className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={15} /> 나가기
        </button>
        <div className="flex items-center gap-3">
          {/* 목숨 */}
          <div className="flex gap-0.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={i < lives ? 'text-[var(--color-danger)]' : 'text-[var(--color-hairline)]'}
                fill={i < lives ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className="text-[13px] font-bold" style={{ color: theme.primary }}>
            Lv.{level}
          </span>
          {combo > 1 && (
            <span className="text-[12px] font-bold text-[var(--color-warning)]">
              ×{combo}
            </span>
          )}
          <span className="text-[13px] text-[var(--color-ink-muted)]">
            {correct}/{words.current.length}
          </span>
        </div>
      </div>

      {/* 낙하 아레나 */}
      <div
        ref={arenaRef}
        className="relative flex-1 rounded-[20px] overflow-hidden mb-3"
        style={{
          backgroundColor: theme.cardBg,
          border: `1.5px solid ${theme.cardBorder}`,
          minHeight: 200,
        }}
      >
        {currentWord && (
          <FallingCard
            key={wordIndex}
            definition={currentWord.definition}
            level={level}
            onMiss={handleMiss}
            stopRef={stopRef}
            lastYRef={lastCardY}
            correct={correctFeedback}
            theme={theme}
          />
        )}

        {/* 오답/미스 시 카드가 멈춘 위치에 정답 표시 */}
        {revealVisible && revealWord && (
          <div
            className="absolute px-4 py-2 rounded-[12px] text-[13px] font-bold animate-fade-in shadow-md"
            style={{
              left: '50%',
              top: Math.min(Math.max(revealY, 8), (arenaRef.current?.offsetHeight ?? 300) - 48),
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            정답: {revealWord.term}
          </div>
        )}
      </div>

      {/* 입력 영역 — FallingCard와 완전히 분리된 트리 */}
      {mobile ? (
        // 모바일: 4지선다 탭
        <div className="grid grid-cols-2 gap-2 pb-2 shrink-0">
          {mobileChoices.map(term => {
            const isWrong = wrongChoiceId === term;
            return (
              <button
                key={term}
                onClick={() => handleSubmit(term)}
                disabled={correctFeedback}
                className={cn(
                  'p-3 rounded-[12px] border-2 text-[14px] font-semibold transition-all active:scale-95',
                  isWrong
                    ? 'border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)] animate-wrong-shake'
                    : 'border-[var(--color-hairline)] bg-white hover:border-[var(--color-primary)]',
                )}
              >
                {term}
              </button>
            );
          })}
        </div>
      ) : (
        // 데스크탑: 텍스트 입력 (FallingInput은 완전히 독립된 컴포넌트)
        <div className="shrink-0 pb-2">
          <FallingInput
            onSubmit={handleSubmit}
            wrongKey={wrongKey}
            theme={theme}
            disabled={correctFeedback}
          />
        </div>
      )}

    </div>
  );
}
