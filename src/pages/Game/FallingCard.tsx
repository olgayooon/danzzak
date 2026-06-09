import { memo, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

/** 레벨별 낙하 시간 (ms). 인덱스 = level - 1 */
const FALL_DURATIONS = [8000, 6500, 5000, 3500, 2000];

interface FallingCardProps {
  definition: string;
  level: number;
  onMiss: () => void;
  stopRef: React.RefObject<boolean>;
  /** 부모가 카드의 현재 Y 위치를 읽기 위한 ref */
  lastYRef?: React.RefObject<number>;
  correct?: boolean;
  theme: { primary: string; cardBg: string; cardBorder: string };
}

/**
 * 낙하 애니메이션 전용 카드.
 * - 위치를 requestAnimationFrame으로 직접 DOM 조작 → JSX style과 충돌 없음
 * - transform은 JSX style prop에 절대 포함하지 않음 (React가 덮어쓰지 못하게)
 * - React.memo로 감싸 부모 리렌더링 시 재렌더링 차단
 */
export const FallingCard = memo(function FallingCard({
  definition,
  level,
  onMiss,
  stopRef,
  lastYRef,
  correct = false,
  theme,
}: FallingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // onMiss를 ref로 유지해 클로저 내부에서 항상 최신 버전 호출
  const onMissRef = useRef(onMiss);
  useEffect(() => { onMissRef.current = onMiss; });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const arena = card.parentElement;
    if (!arena) return;

    const arenaH = arena.offsetHeight;
    // 카드 높이가 렌더링 전일 수 있으므로 최소값 보장
    const cardH = Math.max(card.offsetHeight, 60);

    // 화면 위쪽에서 시작 (전체 카드가 숨겨진 위치)
    let y = -(cardH + 10);

    const fallDuration = FALL_DURATIONS[Math.min(level - 1, 4)];
    // 총 이동 거리: 시작 위치(음수) → 아레나 바닥 아래
    const totalDist = arenaH + cardH + 20;
    // 60fps 기준 속도 (px/frame)
    const speed = totalDist / (fallDuration / (1000 / 60));

    // 초기 위치 — JSX style prop이 아니라 여기서만 transform을 설정
    card.style.transform = `translate(-50%, ${y}px)`;

    let rafId: number;

    function tick() {
      // 외부에서 stop 신호가 오면 루프 종료 (정답 처리 시)
      if (stopRef.current) return;

      y += speed;
      card!.style.transform = `translate(-50%, ${y}px)`;
      if (lastYRef) lastYRef.current = y;

      if (y >= arenaH) {
        onMissRef.current();
        return; // 루프 종료
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
    // level이 바뀔 때만 속도 재계산하며 루프 재시작
    // stopRef는 안정된 ref 객체이므로 의존성 배열에 추가해도 재시작 안 됨
  }, [level, stopRef]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute px-5 py-3 rounded-[12px] font-bold text-[16px] shadow-lg will-change-transform',
        correct && 'animate-correct-pop',
      )}
      style={{
        // left만 JSX로 관리 — transform은 RAF가 전담
        left: '50%',
        maxWidth: '88%',
        textAlign: 'center',
        backgroundColor: correct ? 'var(--color-success-subtle)' : theme.cardBg,
        border: `2px solid ${correct ? 'var(--color-success)' : theme.primary}`,
        color: 'var(--color-ink)',
      }}
    >
      {definition}
    </div>
  );
});
