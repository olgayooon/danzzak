import { useSettingsStore } from '../store/settingsStore';

// ── AudioContext 싱글턴 ────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc  = ctx.createOscillator();
  const vol  = ctx.createGain();
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  vol.gain.setValueAtTime(gain, ctx.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.01);
}

// ── 효과음 ────────────────────────────────────────────────────

export function playSound(type: 'correct' | 'wrong' | 'combo' | 'clear' | 'tick') {
  if (!useSettingsStore.getState().soundEnabled) return;
  switch (type) {
    case 'correct':
      playTone(523, 0.15, 'sine', 0.25);          // C5
      break;
    case 'wrong':
      playTone(220, 0.25, 'sawtooth', 0.18);       // A3
      break;
    case 'combo':
      playTone(659, 0.1,  'sine', 0.28);
      setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 90);   // E5 → G5
      break;
    case 'clear':
      playTone(523, 0.12, 'sine', 0.3);
      setTimeout(() => playTone(659, 0.12, 'sine', 0.3),  110);
      setTimeout(() => playTone(784, 0.12, 'sine', 0.3),  220);
      setTimeout(() => playTone(1046, 0.35, 'sine', 0.35), 330); // C6 높은 마무리
      break;
    case 'tick':
      playTone(400, 0.05, 'sine', 0.08);
      break;
  }
}

// ── 파티클 레이어 ─────────────────────────────────────────────

function getParticleLayer(): HTMLDivElement {
  let el = document.getElementById('danzzak-particles') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'danzzak-particles';
    el.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * x, y (screen 좌표)에서 파티클을 방사형으로 분출한다.
 * - `prefers-reduced-motion` 또는 particleEnabled=false 시 즉시 반환.
 */
export function triggerParticle(
  x: number,
  y: number,
  color: string,
  count = 10,
) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!useSettingsStore.getState().particleEnabled) return;

  const layer = getParticleLayer();

  for (let i = 0; i < count; i++) {
    const angle    = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const dist     = 35 + Math.random() * 45;
    const dx       = Math.cos(angle) * dist;
    const dy       = Math.sin(angle) * dist;
    const size     = 5 + Math.random() * 5;
    const delay    = Math.random() * 80;

    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      left:${x}px;top:${y}px;
      opacity:0;
      --p-dx:${dx}px;--p-dy:${dy}px;
      animation:particle-burst 600ms ease-out ${delay}ms forwards;
    `;
    layer.appendChild(p);
    setTimeout(() => p.remove(), 700 + delay);
  }
}

/** 카드 / 요소의 중심 좌표로 파티클을 트리거하는 헬퍼 */
export function triggerParticleAt(
  el: HTMLElement | null,
  color: string,
  count = 10,
) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  triggerParticle(r.left + r.width / 2, r.top + r.height / 2, color, count);
}

/**
 * 점수 팝업: 지정 좌표에서 "+N"이 위로 떠오르며 사라진다.
 */
export function triggerScorePopup(x: number, y: number, points: number) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!useSettingsStore.getState().particleEnabled) return;

  const layer = getParticleLayer();
  const el = document.createElement('div');
  el.textContent = `+${points}`;
  el.style.cssText = `
    position:absolute;
    left:${x}px;top:${y}px;
    transform:translateX(-50%);
    color:#10B981;
    font-weight:800;font-size:22px;
    animation:score-float 800ms ease-out forwards;
    pointer-events:none;
    white-space:nowrap;
  `;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

/**
 * 화면 테두리를 color 색상으로 잠깐 글로우.
 * 콤보 5+ 시 초록 글로우 등에 사용.
 */
export function triggerGlow(color: string, duration = 700) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!useSettingsStore.getState().particleEnabled) return;

  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;inset:0;
    pointer-events:none;z-index:9998;
    box-shadow:inset 0 0 0 5px ${color};
    animation:glow-pulse ${duration}ms ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration + 50);
}

/**
 * 게임 클리어 컨페티 — 화면 전체에 파티클 분출 (1.5초).
 */
export function triggerConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!useSettingsStore.getState().particleEnabled) return;

  const colors = ['#10B981', '#7C3AED', '#EC4899', '#F59E0B', '#3B82F6', '#EF4444'];
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const x = w * 0.1 + Math.random() * w * 0.8;
      const y = h * 0.05 + Math.random() * h * 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      triggerParticle(x, y, color, 14);
    }, i * 180);
  }
}
