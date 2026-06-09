import { useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGameWordSet } from '../../hooks/useGameWordSet';
import { useStudyRecord } from '../../hooks/useStudyRecord';
import { useCloudJumpGame } from '../../hooks/useCloudJumpGame';
import { CloudJumpHUD } from '../../components/games/CloudJumpHUD';
import { QuizOverlay } from '../../components/games/QuizOverlay';
import type { GameResult } from '../../types/game';

export default function CloudJumpGame() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { wordSet, returnPath, restorePending } = useGameWordSet(setId);
  const { addRecord } = useStudyRecord();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [wrongEffect, setWrongEffect] = useState(false);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { hud, handleQuizAnswer, restart } = useCloudJumpGame(
    canvasRef,
    wordSet?.words ?? [],
    setId ?? '',
    (r) => {
      addRecord(r);
      setResult(r);
    },
  );

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!isCorrect) {
      setWrongEffect(true);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongEffect(false), 600);
    }
    handleQuizAnswer(isCorrect);
  }, [handleQuizAnswer]);

  function handleRetry() {
    setResult(null);
    restart();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className="text-[var(--color-ink-muted)]">단어가 4개 이상이어야 플레이할 수 있어요.</p>
        <button
          onClick={() => navigate(returnPath)}
          className="px-5 py-2.5 rounded-full text-[14px] font-semibold bg-[var(--color-primary)] text-white"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div
      className={wrongEffect ? 'animate-wrong-shake' : ''}
      style={{ position: 'fixed', inset: 0, top: 56, overflow: 'hidden' }}
    >
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />

      {/* 오답 붉은 플래시 */}
      {wrongEffect && (
        <div
          className="absolute inset-0 z-20 pointer-events-none animate-wrong-flash"
          style={{ background: 'rgba(239,68,68,0.45)' }}
        />
      )}

      {/* 나가기 버튼 */}
      <button
        onClick={() => navigate(returnPath)}
        className="absolute top-3 left-4 z-20 flex items-center gap-1 text-[13px] font-semibold text-white/80 hover:text-white transition-colors"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
      >
        <ArrowLeft size={16} /> 나가기
      </button>

      {/* HUD */}
      <CloudJumpHUD
        lives={hud.lives}
        score={hud.score}
        combo={hud.combo}
        comboMessage={hud.comboMessage}
        scorePopup={hud.scorePopup}
      />

      {/* 퀴즈 오버레이 */}
      {hud.phase === 'quiz' && hud.quiz && (
        <QuizOverlay quiz={hud.quiz} onAnswer={handleAnswer} />
      )}

      {/* 모바일 터치 힌트 */}
      {hud.phase === 'playing' && hud.score === 0 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
          <span
            className="text-white/60 text-[13px] font-medium px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            ← 왼쪽 터치 / 오른쪽 터치 →
          </span>
        </div>
      )}

      {/* 게임 오버 */}
      {result && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center px-6"
          style={{ background: 'rgba(15,10,40,0.85)' }}
        >
          <div
            className="w-full max-w-[380px] rounded-[24px] p-7 flex flex-col gap-5 text-center"
            style={{ background: 'rgba(255,255,255,0.97)' }}
          >
            <div>
              <p className="text-[36px] mb-1">🌤️</p>
              <p className="text-[22px] font-extrabold text-[var(--color-ink)]">게임 종료!</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="점수" value={result.score ?? 0} />
              <StatCard label="최고 콤보" value={`x${result.combo}`} />
              <StatCard label="정답" value={`${result.correct}개`} />
              <StatCard label="오답" value={`${result.wrong}개`} />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRetry}
                className="w-full py-3.5 rounded-[14px] text-[16px] font-bold text-white"
                style={{ background: '#7C3AED' }}
              >
                다시 하기
              </button>
              <button
                onClick={() => navigate(returnPath)}
                className="w-full py-3 rounded-[14px] text-[15px] font-semibold text-[var(--color-ink-muted)]"
                style={{ background: 'var(--color-surface-2)' }}
              >
                단어 목록으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-[12px] px-3 py-3 flex flex-col gap-0.5"
      style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.14)' }}
    >
      <p className="text-[11px] font-bold text-violet-500 uppercase tracking-wide">{label}</p>
      <p className="text-[22px] font-extrabold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
