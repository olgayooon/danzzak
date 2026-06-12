import { useEffect, useRef, useState } from 'react';
import type { QuizState } from '../../hooks/useCloudJumpGame';

const TIME_LIMIT = 5;
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  quiz: QuizState;
  onAnswer: (isCorrect: boolean) => void;
}

export function QuizOverlay({ quiz, onAnswer }: Props) {
  const { word, choices } = quiz;
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const answeredRef = useRef(false);

  // 답변 처리 (중복 호출 방지)
  function answer(isCorrect: boolean) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    onAnswer(isCorrect);
  }

  // 카운트다운
  useEffect(() => {
    answeredRef.current = false;
    setTimeLeft(TIME_LIMIT);

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          answer(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.term]);

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= choices.length) answer(choices[n - 1] === word.definition);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choices, word.definition]);

  const progress = timeLeft / TIME_LIMIT;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const timerColor = timeLeft <= 2 ? '#EF4444' : timeLeft <= 3 ? '#F59E0B' : '#7C3AED';

  return (
    <div className="absolute inset-0 flex items-center justify-center px-5 pointer-events-none">
      <div
        className="w-full max-w-[400px] rounded-[20px] p-6 flex flex-col gap-4 pointer-events-auto"
        style={{ background: 'var(--color-surface)', boxShadow: '0 8px 40px rgba(0,0,0,0.35)' }}
      >
        {/* 단어 + 타이머 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-1">단어</p>
            <p className="text-[28px] font-extrabold text-[var(--color-ink)] tracking-tight leading-tight">{word.term}</p>
          </div>

          {/* 원형 타이머 */}
          <div className="relative shrink-0 w-[56px] h-[56px] flex items-center justify-center">
            <svg width="56" height="56" className="absolute inset-0 -rotate-90">
              <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
              <circle
                cx="28" cy="28" r={RADIUS}
                fill="none"
                stroke={timerColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <span
              className="text-[20px] font-extrabold tabular-nums"
              style={{ color: timerColor, transition: 'color 0.3s' }}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* 선택지 */}
        <div className="grid grid-cols-2 gap-2">
          {choices.map((choice, i) => (
            <button
              key={choice}
              onClick={() => answer(choice === word.definition)}
              className="flex items-start gap-2 p-3 rounded-[12px] text-left text-[14px] font-medium transition-all active:scale-95 hover:scale-[1.02]"
              style={{
                background: 'rgba(124,58,237,0.07)',
                color: 'var(--color-ink)',
                border: '1.5px solid rgba(124,58,237,0.18)',
              }}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-white mt-[1px]"
                style={{ background: '#7C3AED' }}
              >
                {i + 1}
              </span>
              <span className="leading-snug">{choice}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-[12px] text-[var(--color-ink-faint)]">키보드 1~4로 선택 가능</p>
      </div>
    </div>
  );
}
