import { useEffect, useRef, useState } from 'react';
import type { HUDState } from '../../hooks/useCloudJumpGame';

const MAX_LIVES = 3;

interface ScorePopupItem { id: number; value: number }

type Props = Pick<HUDState, 'lives' | 'score' | 'combo' | 'comboMessage' | 'scorePopup'>;

export function CloudJumpHUD({ lives, score, combo, comboMessage, scorePopup }: Props) {
  const [popups, setPopups] = useState<ScorePopupItem[]>([]);

  // 새 scorePopup이 들어올 때마다 목록에 추가하고 900ms 후 제거
  useEffect(() => {
    if (!scorePopup) return;
    setPopups(prev => [...prev, scorePopup]);
    const t = setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== scorePopup.id));
    }, 900);
    return () => clearTimeout(t);
  }, [scorePopup?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* 상단 HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-2 pointer-events-none">
        {/* 목숨 */}
        <div className="flex gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className="text-[22px] leading-none" style={{ filter: i < lives ? 'none' : 'grayscale(1) opacity(0.4)' }}>
              ❤️
            </span>
          ))}
        </div>

        {/* 점수 + 팝업 */}
        <div className="relative text-right">
          <p className="text-[22px] font-extrabold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {score.toLocaleString()}
          </p>
          {popups.map(p => (
            <span
              key={p.id}
              className="absolute right-0 text-[14px] font-extrabold text-emerald-300 pointer-events-none"
              style={{
                top: -8,
                animation: 'floatUp 0.9s ease-out forwards',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              +{p.value}
            </span>
          ))}
        </div>
      </div>

      {/* 콤보 칭찬 / 마일스톤 메시지 (중앙 상단) */}
      {comboMessage && (
        <div className="absolute top-14 left-0 right-0 flex justify-center pointer-events-none">
          <span
            key={comboMessage.text}
            className="text-[28px] font-extrabold"
            style={{
              color: comboMessage.color,
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              animation: 'comboPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}
          >
            {comboMessage.text}
          </span>
        </div>
      )}

      {/* 하단 콤보 카운터 */}
      {combo >= 2 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <span
            className="px-4 py-1.5 rounded-full text-[15px] font-bold text-white"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          >
            🔥 {combo} combo
          </span>
        </div>
      )}
    </>
  );
}
