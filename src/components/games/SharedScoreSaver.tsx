import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWordSet } from '../../hooks/useWordSet';
import { SHARED_GAME_SESSION_KEY, readSharedGameSession } from '../../utils/shareGame';
import type { GameResult } from '../../types/game';
import { Button } from '../ui/Button';

const SCORE_KEY_PREFIX = 'danzzak-scores-';

interface Props {
  result: GameResult;
}

/**
 * 공유 게임(_shared_ prefix)이 끝났을 때 점수를 localStorage에 저장하고
 * 공유 페이지로 돌아가는 링크를 보여줌.
 */
export function SharedScoreSaver({ result }: Props) {
  const navigate = useNavigate();
  const { deleteSet } = useWordSet();
  const savedRef = useRef(false);

  const session = readSharedGameSession();

  useEffect(() => {
    if (!session || savedRef.current) return;
    savedRef.current = true;

    const key = SCORE_KEY_PREFIX + session.shareHash;
    const prev = (() => {
      try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
    })() as { nickname: string; pin: string; correct: number; wrong: number; combo: number; playedAt: string }[];

    // 같은 PIN은 최고 점수로 갱신
    const filtered = session.pin
      ? prev.filter(s => s.pin !== session.pin)
      : prev;

    filtered.push({
      nickname: session.nickname,
      pin: session.pin,
      correct: result.correct,
      wrong: result.wrong,
      combo: result.combo,
      playedAt: result.playedAt,
    });
    localStorage.setItem(key, JSON.stringify(filtered));

    // 임시 세트 삭제
    if (session.tempSetId) {
      setTimeout(() => {
        deleteSet(session.tempSetId);
        sessionStorage.removeItem(SHARED_GAME_SESSION_KEY);
      }, 2000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return null;

  return (
    <div className="mt-6 rounded-[14px] bg-[var(--color-primary-subtle)] border border-[var(--color-primary)] px-4 py-4 text-center">
      <p className="text-[14px] font-bold text-[var(--color-primary)] mb-1">
        {session.nickname}님의 기록이 저장됐어요! 🎉
      </p>
      <p className="text-[13px] text-[var(--color-ink-muted)] mb-3">
        정답 {result.correct}개 · 오답 {result.wrong}개
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(session.returnPath)}
      >
        기록 페이지로 돌아가기
      </Button>
    </div>
  );
}
