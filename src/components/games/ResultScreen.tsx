import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Home, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import type { GameResult } from '../../types/game';
import { GAME_MODE_INFO } from '../../types/game';
import { calcAccuracy } from '../../hooks/useStudyRecord';

interface ResultScreenProps {
  result: GameResult;
  onRetry: () => void;
}

export function ResultScreen({ result, onRetry }: ResultScreenProps) {
  const navigate = useNavigate();
  const [showWrong, setShowWrong] = useState(false);
  const accuracy = calcAccuracy(result);
  const modeInfo = GAME_MODE_INFO[result.mode];

  const grade =
    accuracy >= 90 ? { emoji: '🏆', label: '완벽해요!', color: 'text-[var(--color-accent-yellow)]' } :
    accuracy >= 70 ? { emoji: '🎉', label: '잘 했어요!', color: 'text-[var(--color-success)]' } :
    accuracy >= 50 ? { emoji: '💪', label: '조금 더 연습해요', color: 'text-[var(--color-warning)]' } :
                     { emoji: '📚', label: '다시 도전해봐요', color: 'text-[var(--color-danger)]' };

  const mins = Math.floor(result.duration / 60);
  const secs = result.duration % 60;

  return (
    <div className="flex flex-col items-center gap-8 py-12 animate-fade-in">
      <div className="text-6xl">{grade.emoji}</div>
      <div className="text-center">
        <p className={`text-[18px] font-semibold mb-1 ${grade.color}`}>{grade.label}</p>
        <p className="text-[48px] font-extrabold text-[var(--color-ink)] tracking-tight">{accuracy}점</p>
        <p className="text-[14px] text-[var(--color-ink-muted)]">{modeInfo.label} 점수</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {[
          { label: '정답', value: result.correct, color: 'text-[var(--color-success)]' },
          { label: '오답', value: result.wrong, color: 'text-[var(--color-danger)]' },
          { label: '최고 콤보', value: result.combo, color: 'text-[var(--color-accent-yellow)]' },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col items-center bg-[var(--color-surface)] rounded-[14px] p-4 border border-[var(--color-hairline)]">
            <span className={`text-[24px] font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[14px] text-[var(--color-ink-muted)]">
        소요 시간: {mins > 0 ? `${mins}분 ` : ''}{secs}초
      </p>

      {result.wrongWords && result.wrongWords.length > 0 && (
        <div className="w-full max-w-sm">
          <button
            onClick={() => setShowWrong(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] border-2 border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)] font-semibold text-[14px] transition-all"
          >
            <span>오답 확인하기 ({result.wrongWords.length}개)</span>
            {showWrong ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showWrong && (
            <div className="mt-2 rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-surface)] overflow-hidden">
              <table className="w-full text-[14px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-muted)] w-[40%]">단어</th>
                    <th className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-muted)]">뜻</th>
                  </tr>
                </thead>
                <tbody>
                  {result.wrongWords.map((word, i) => (
                    <tr
                      key={word.id}
                      style={{ borderTop: i > 0 ? '1px solid var(--color-hairline)' : undefined }}
                    >
                      <td className="px-4 py-3 font-bold text-[var(--color-ink)] align-top">{word.term}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-muted)] align-top">{word.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" onClick={onRetry}>
          <RotateCcw size={16} />
          다시 하기
        </Button>
        {!result.setId.startsWith('_shared_') && (
          <Button variant="secondary" onClick={() => navigate(`/study/${result.setId}`)}>
            <BookOpen size={16} />
            학습 모드 선택
          </Button>
        )}
        <Button variant="utility" onClick={() => navigate('/')}>
          <Home size={16} />
          홈
        </Button>
      </div>

    </div>
  );
}
