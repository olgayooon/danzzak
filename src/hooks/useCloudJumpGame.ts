import { useRef, useState, useEffect, useCallback } from 'react';
import type { RefObject } from 'react';
import type { Word } from '../types/word';
import type { GameResult } from '../types/game';
import { shuffleArray, generateChoices } from '../utils/gameUtils';
import { playSound } from '../utils/feedback';

// ── 하늘 스테이지 ────────────────────────────────────────────────
const SKY_STAGES = [
  { name: 'day',    scoreRange: [0,    2000] as [number,number], top: '#87CEEB', bottom: '#E0F4FF', cloudColor: 'rgba(255,255,255,0.9)',     cloudBorder: 'rgba(200,235,255,0.8)', label: '☀️ 맑은 하늘' },
  { name: 'sunset', scoreRange: [2000, 3500] as [number,number], top: '#FF6B6B', bottom: '#FFD93D', cloudColor: 'rgba(255,220,180,0.85)',    cloudBorder: 'rgba(255,150,100,0.6)', label: '🌅 노을 하늘' },
  { name: 'dusk',   scoreRange: [3500, 5000] as [number,number], top: '#2C1654', bottom: '#FF6B6B', cloudColor: 'rgba(200,150,220,0.7)',     cloudBorder: 'rgba(150,80,180,0.5)',  label: '🌆 어두운 하늘' },
  { name: 'night',  scoreRange: [5000, 7000] as [number,number], top: '#0A0A1A', bottom: '#1A1A4A', cloudColor: 'rgba(150,150,200,0.5)',     cloudBorder: 'rgba(100,100,180,0.4)', label: '🌙 밤하늘' },
  { name: 'space',  scoreRange: [7000, Infinity] as [number,number], top: '#000000', bottom: '#0A0A2A', cloudColor: 'rgba(100,80,160,0.4)', cloudBorder: 'rgba(120,80,200,0.3)', label: '🌌 우주' },
] as const;

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
function lerpColor(a: string, b: string, t: number): string {
  const [ar,ag,ab] = hexToRgb(a);
  const [br,bg,bb] = hexToRgb(b);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}
function getCurrentSkyColors(score: number) {
  const idx = SKY_STAGES.findIndex(s => score >= s.scoreRange[0] && score < s.scoreRange[1]);
  const si = idx === -1 ? SKY_STAGES.length - 1 : idx;
  const cur = SKY_STAGES[si];
  const nxt = SKY_STAGES[si + 1] ?? cur;
  const [min, max] = cur.scoreRange;
  const progress = max === Infinity ? 1 : (score - min) / (max - min);
  const t = Math.max(0, (progress - 0.3) / 0.7);
  return {
    top:        lerpColor(cur.top,    nxt.top,    t),
    bottom:     lerpColor(cur.bottom, nxt.bottom, t),
    cloudColor: t > 0.5 ? nxt.cloudColor : cur.cloudColor,
    stageName:  cur.name as string,
    label:      cur.label as string,
  };
}

// ── 캐릭터 스프라이트 ─────────────────────────────────────────────
const CHARACTER_SIZE = 96; // drawImage 기준 크기 (px)
type CharState = 'idle' | 'crouch' | 'rise1' | 'rise2' | 'peak' | 'fall' | 'preland' | 'land';

const CHAR_SPRITE_PATHS: Record<CharState, string> = {
  idle:    '/character/idle.svg',
  crouch:  '/character/crouch.svg',
  rise1:   '/character/rise1.svg',
  rise2:   '/character/rise2.svg',
  peak:    '/character/peak.svg',
  fall:    '/character/fall.svg',
  preland: '/character/preland.svg',
  land:    '/character/land.svg',
};

// 스쿼시·스트레치 비율 (w + h ≒ 2.0 유지)
const SQUASH: Record<CharState, { w: number; h: number }> = {
  idle:    { w: 1.00, h: 1.00 },
  crouch:  { w: 1.05, h: 0.94 },
  rise1:   { w: 0.95, h: 1.07 },
  rise2:   { w: 0.92, h: 1.12 },
  peak:    { w: 1.00, h: 1.00 },
  fall:    { w: 1.03, h: 0.97 },
  preland: { w: 1.08, h: 0.92 },
  land:    { w: 1.15, h: 0.85 },
};

// landingTimer > 100 → land, > 0 → crouch, <= 0 → 일반
function getCharState(vy: number, landingTimer: number): CharState {
  if (landingTimer > 100)              return 'land';
  if (landingTimer > 0)               return 'crouch';
  if (vy < -8)                        return 'rise2';
  if (vy < -4)                        return 'rise1';
  if (vy >= -4 && vy <= -1)           return 'peak';
  if (vy > -1 && vy <= 2)             return 'fall';
  if (vy > 2)                         return 'preland';
  return 'idle';
}

interface Star { x: number; y: number; size: number; phase: number }
function generateStars(W: number, H: number): Star[] {
  return Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 1,
    phase: Math.random() * Math.PI * 2,
  }));
}

// ── 상수 ────────────────────────────────────────────────────────
const GRAVITY = 0.35;
const JUMP_FORCE = -15;
const PLAYER_RADIUS = 18;
const CLOUD_GAP_Y = 90;
const CLOUD_HEIGHT = 28;
const SCROLL_THRESHOLD = 0.4;
const MOVE_SPEED = 4;
const MAX_LIVES = 3;
const RETURN_FRAMES = 36;

const COMBO_MESSAGES: Record<number, { text: string; color: string }> = {
  3:  { text: 'Good! 🔥',      color: '#10B981' },
  6:  { text: 'Great! ⚡',     color: '#3B82F6' },
  10: { text: 'Excellent! 💥', color: '#8B5CF6' },
  15: { text: 'Fantastic! 🌟', color: '#F59E0B' },
};

// ── 타입 ────────────────────────────────────────────────────────
export interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isCheckpoint: boolean;
  stepCount: number;   // 밟은 횟수 (2회 → 제거)
  seed: number;        // 구름 모양 시드 (생성 시 고정)
}

interface GS {
  player: { x: number; y: number; vy: number; vx: number };
  clouds: Cloud[];
  cameraY: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  cloudStepCount: number;
  nextQuizAt: number;
  phase: 'playing' | 'quiz' | 'returning' | 'gameover';
  checkpointY: number;
  checkpointCloud: Cloud | null;  // 죽었을 때 복원할 구름
  wordIdx: number;
  shuffledWords: Word[];
  correctAnswers: number;
  wrongAnswers: number;
  startTime: number;
  returningFrames: number;
  returningFromY: number;
  returningPlayerX: number;
  checkpointPlayerX: number;
  nextCloudId: number;
  topGeneratedY: number;
  lastLandedCloudId: number;
  heartItem: { x: number; y: number } | null;
  lastScoreMilestone: number;
}

export interface QuizState {
  word: Word;
  choices: string[];
}

export interface HUDState {
  lives: number;
  score: number;
  combo: number;
  phase: 'playing' | 'quiz' | 'returning' | 'gameover';
  comboMessage: { text: string; color: string } | null;
  quiz: QuizState | null;
  scorePopup?: { id: number; value: number } | null;
  stageLabel: string | null;
}

const SCORE_MILESTONES = [500, 1000, 1500, 2000] as const;
const MILESTONE_MESSAGES: Record<number, { text: string; color: string }> = {
  500:  { text: '🎉 500점!',  color: '#10B981' },
  1000: { text: '🎊 1000점!', color: '#3B82F6' },
  1500: { text: '🌟 1500점!', color: '#8B5CF6' },
  2000: { text: '🔥 2000점!', color: '#EF4444' },
};

// 점수에 따른 구름 너비 범위 반환
function cloudWidthRange(score: number): [number, number] {
  if (score < 500)  return [80, 140];   // 2x
  if (score < 1000) return [60, 105];   // 1.5x
  if (score < 2000) return [40, 70];    // 1x
  return [20, 35];                       // 0.5x
}

// ── 헬퍼 ────────────────────────────────────────────────────────
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeCloud(id: number, x: number, y: number, width: number, isCheckpoint = false): Cloud {
  return { id, x, y, width, height: CLOUD_HEIGHT, isCheckpoint, stepCount: 0, seed: Math.random() * 1000 };
}


function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  _seed: number,
  cloudColor: string,
  isCheckpoint: boolean,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, CLOUD_HEIGHT, 6);
  } else {
    ctx.rect(x, y, width, CLOUD_HEIGHT);
  }
  ctx.fillStyle = cloudColor;
  ctx.fill();
  if (isCheckpoint) {
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

function initGS(words: Word[], W: number, H: number): GS {
  const shuffledWords = shuffleArray(words);
  const [initMinW, initMaxW] = cloudWidthRange(0);
  const firstCloudW = Math.round((initMinW + initMaxW) / 2);
  const firstCloud = makeCloud(0, W / 2 - firstCloudW / 2, H - 80, firstCloudW);
  const clouds: Cloud[] = [firstCloud];

  let nextId = 1;
  let topY = firstCloud.y;
  for (let i = 0; i < 25; i++) {
    // 첫 6개는 간격 좁게 + X를 중앙 60% 범위로 제한해 초반 진입 보장
    const isEarly = i < 6;
    topY -= (isEarly ? 65 : CLOUD_GAP_Y) + randInt(-10, 10);
    const [minW, maxW] = cloudWidthRange(0);
    const cw = randInt(isEarly ? Math.round(minW * 1.1) : minW, maxW);
    const xMin = isEarly ? Math.floor(W * 0.15) : 40;
    const xMax = isEarly ? Math.floor(W * 0.85 - cw) : W - cw - 40;
    const cx = randInt(xMin, Math.max(xMin + 1, xMax));
    clouds.push(makeCloud(nextId++, cx, topY, cw));
  }

  return {
    player: { x: W / 2, y: firstCloud.y - PLAYER_RADIUS, vy: 0, vx: 0 },
    clouds,
    cameraY: 0,
    score: 0,
    lives: MAX_LIVES,
    combo: 0,
    maxCombo: 0,
    cloudStepCount: 0,
    nextQuizAt: Math.random() < 0.5 ? 7 : 8,
    phase: 'playing',
    checkpointY: firstCloud.y - PLAYER_RADIUS,
    wordIdx: 0,
    shuffledWords,
    correctAnswers: 0,
    wrongAnswers: 0,
    startTime: Date.now(),
    returningFrames: 0,
    returningFromY: 0,
    returningPlayerX: W / 2,
    checkpointPlayerX: W / 2,
    nextCloudId: nextId,
    topGeneratedY: topY,
    lastLandedCloudId: -1,
    checkpointCloud: null,
    heartItem: null,
    lastScoreMilestone: 0,
  };
}

// ── 훅 ──────────────────────────────────────────────────────────
export function useCloudJumpGame(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  words: Word[],
  setId: string,
  onFinish: (result: GameResult) => void,
) {
  const gsRef = useRef<GS | null>(null);
  const rafRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const touchRef = useRef({ left: false, right: false });
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupIdRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const lastStageNameRef = useRef<string>('day');
  const stageLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charImagesRef = useRef<Partial<Record<CharState, HTMLImageElement>>>({});
  // 착지 타이머: 150ms 카운트다운. >100 → land, >0 → crouch, <=0 → 일반
  const landingTimerRef = useRef(0);

  // stable refs so loop closure doesn't go stale
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  const setIdRef = useRef(setId);
  useEffect(() => { setIdRef.current = setId; }, [setId]);
  const wordsRef = useRef(words);
  useEffect(() => { wordsRef.current = words; }, [words]);

  const [hud, setHud] = useState<HUDState>({
    lives: MAX_LIVES, score: 0, combo: 0,
    phase: 'playing', comboMessage: null, quiz: null, stageLabel: null,
  });

  // ── 게임 오버 처리 ──────────────────────────────────────────
  const triggerGameOver = useCallback((gs: GS) => {
    gs.phase = 'gameover';
    const result: GameResult = {
      setId: setIdRef.current,
      mode: 'cloud-jump',
      correct: gs.correctAnswers,
      wrong: gs.wrongAnswers,
      duration: Math.round((Date.now() - gs.startTime) / 1000),
      combo: gs.maxCombo,
      score: gs.score,
      playedAt: new Date().toISOString(),
    };
    setHud(h => ({ ...h, lives: 0, phase: 'gameover', quiz: null }));
    onFinishRef.current(result);
  }, []);

  // ── 퀴즈 정답/오답 ──────────────────────────────────────────
  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    const gs = gsRef.current;
    if (!gs || gs.phase !== 'quiz') return;

    gs.wordIdx += 1;
    if (gs.wordIdx >= gs.shuffledWords.length) {
      gs.shuffledWords = shuffleArray(wordsRef.current);
      gs.wordIdx = 0;
    }

    if (isCorrect) {
      gs.score += 100;
      gs.combo += 1;
      gs.maxCombo = Math.max(gs.maxCombo, gs.combo);
      gs.correctAnswers += 1;
      gs.phase = 'playing';
      playSound(gs.combo >= 3 ? 'combo' : 'correct');

      // 콤보 10배수마다 하트 아이템 스폰
      if (gs.combo % 10 === 0) {
        const H = canvasRef.current?.height ?? 700;
        const visibleClouds = gs.clouds.filter(
          c => c.y > gs.cameraY - H * 0.5 && c.y < gs.cameraY + H * 1.5,
        );
        if (visibleClouds.length > 0) {
          const cloud = visibleClouds[Math.floor(Math.random() * visibleClouds.length)];
          gs.heartItem = { x: cloud.x + cloud.width / 2, y: cloud.y - 28 };
        }
      }

      // 마일스톤 체크
      const quizMilestone = SCORE_MILESTONES.find(m => m > gs.lastScoreMilestone && gs.score >= m);
      if (quizMilestone) {
        gs.lastScoreMilestone = quizMilestone;
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        setHud(h => ({ ...h, lives: gs.lives, score: gs.score, combo: gs.combo, phase: 'playing', quiz: null, scorePopup: { id: ++popupIdRef.current, value: 100 }, comboMessage: MILESTONE_MESSAGES[quizMilestone] }));
        comboTimerRef.current = setTimeout(() => setHud(h => ({ ...h, comboMessage: null })), 2000);
      }

      const msg = COMBO_MESSAGES[gs.combo];
      if (msg && !quizMilestone) {
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        setHud(h => ({ ...h, lives: gs.lives, score: gs.score, combo: gs.combo, phase: 'playing', quiz: null, scorePopup: { id: ++popupIdRef.current, value: 100 }, comboMessage: msg }));
        comboTimerRef.current = setTimeout(() => setHud(h => ({ ...h, comboMessage: null })), 1500);
      } else if (!quizMilestone) {
        setHud(h => ({ ...h, lives: gs.lives, score: gs.score, combo: gs.combo, phase: 'playing', quiz: null, scorePopup: { id: ++popupIdRef.current, value: 100 } }));
      }
    } else {
      gs.combo = 0;
      gs.lives -= 1;
      gs.wrongAnswers += 1;
      playSound('wrong');

      if (gs.lives <= 0) {
        triggerGameOver(gs);
      } else {
        // 직전 구름 복원 (stepCount 0으로 초기화 — 다시 2번 밟으면 사라짐)
        if (gs.checkpointCloud) {
          gs.clouds.push({ ...gs.checkpointCloud, stepCount: 0 });
          gs.checkpointCloud = null;
        }
        gs.phase = 'returning';
        gs.returningFromY = gs.player.y;
        gs.returningPlayerX = gs.player.x;
        gs.returningFrames = 0;
        gs.player.vy = 0;
        gs.player.vx = 0;
        setHud(h => ({ ...h, lives: gs.lives, score: gs.score, combo: 0, phase: 'returning', quiz: null }));
      }
    }
  }, [triggerGameOver]);

  // ── 재시작 ──────────────────────────────────────────────────
  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gsRef.current = initGS(wordsRef.current, canvas.width, canvas.height);
    lastStageNameRef.current = 'day';
    setHud({ lives: MAX_LIVES, score: 0, combo: 0, phase: 'playing', comboMessage: null, quiz: null, stageLabel: null });
  }, [canvasRef]);

  // ── RAF 루프 (setup once) ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || words.length < 4) return;

    // 캐릭터 이미지 preload
    (Object.entries(CHAR_SPRITE_PATHS) as [CharState, string][]).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      charImagesRef.current[key] = img;
    });

    // Canvas 크기 초기화
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 56;
      starsRef.current = generateStars(canvas.width, canvas.height);
      if (!gsRef.current) {
        gsRef.current = initGS(wordsRef.current, canvas.width, canvas.height);
        setHud({ lives: MAX_LIVES, score: 0, combo: 0, phase: 'playing', comboMessage: null, quiz: null, stageLabel: null });
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // 키 입력
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 터치 입력
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(t => {
        if (t.clientX < window.innerWidth / 2) touchRef.current.left = true;
        else touchRef.current.right = true;
      });
    };
    const onTouchEnd = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach(t => {
        if (t.clientX < window.innerWidth / 2) touchRef.current.left = false;
        else touchRef.current.right = false;
      });
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // ── 게임 루프 ─────────────────────────────────────────────
    let lastTimestamp = 0;
    function loop(timestamp: number) {
      // 델타 타임 (60fps 기준 정규화, 최대 2배 캡 — 탭 전환 후 복귀 시 튐 방지)
      const dt = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 16.667, 2) : 1;
      lastTimestamp = timestamp;

      const gs = gsRef.current;
      if (!gs) { rafRef.current = requestAnimationFrame(loop); return; }
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;
      const W = canvas!.width;
      const H = canvas!.height;

      // 착지 타이머 감소 (ms 단위)
      if (landingTimerRef.current > 0) {
        landingTimerRef.current = Math.max(0, landingTimerRef.current - dt * 16.667);
      }

      // ── update ─────────────────────────────────────────────
      if (gs.phase === 'returning') {
        gs.returningFrames += dt;
        const t = Math.min(gs.returningFrames / RETURN_FRAMES, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        gs.player.y = gs.returningFromY + (gs.checkpointY - gs.returningFromY) * ease;
        gs.player.x = gs.returningPlayerX + (gs.checkpointPlayerX - gs.returningPlayerX) * ease;

        if (gs.returningFrames >= RETURN_FRAMES) {
          gs.phase = 'playing';
          gs.player.y = gs.checkpointY;
          gs.player.x = gs.checkpointPlayerX;
          gs.player.vy = JUMP_FORCE;
          setHud(h => ({ ...h, phase: 'playing' }));
        }
      } else if (gs.phase === 'playing') {
        // 입력
        const left = keysRef.current.left || touchRef.current.left;
        const right = keysRef.current.right || touchRef.current.right;
        if (left) gs.player.vx = -MOVE_SPEED;
        else if (right) gs.player.vx = MOVE_SPEED;
        else gs.player.vx *= Math.pow(0.8, dt); // 프레임률 독립적 감속

        // 물리 (델타 타임 적용)
        gs.player.vy += GRAVITY * dt;
        gs.player.x += gs.player.vx * dt;
        gs.player.y += gs.player.vy * dt;

        // X 벽 통과
        if (gs.player.x > W + PLAYER_RADIUS) gs.player.x = -PLAYER_RADIUS;
        else if (gs.player.x < -PLAYER_RADIUS) gs.player.x = W + PLAYER_RADIUS;

        // 구름 충돌 (낙하 중일 때만, 발끝 기준 상단 통과 감지)
        if (gs.player.vy > 0) {
          const pBottom = gs.player.y + PLAYER_RADIUS;
          const prevBottom = pBottom - gs.player.vy * dt;

          for (let ci = 0; ci < gs.clouds.length; ci++) {
            const cloud = gs.clouds[ci];
            const crossedTop = prevBottom <= cloud.y && pBottom >= cloud.y;
            const withinX =
              gs.player.x + PLAYER_RADIUS * 0.6 > cloud.x &&
              gs.player.x - PLAYER_RADIUS * 0.6 < cloud.x + cloud.width;
            if (crossedTop && withinX) {
              gs.player.y = cloud.y - PLAYER_RADIUS;
              gs.player.vy = JUMP_FORCE;
              gs.score += 10;
              gs.lastLandedCloudId = cloud.id;
              // 착지 애니메이션 타이머 (150ms 카운트다운: >100 land, >0 crouch)
              landingTimerRef.current = 150;
              playSound('tick');

              // 밟은 횟수 증가 — 2번째면 제거, 1번째면 유지
              cloud.stepCount += 1;
              if (cloud.stepCount >= 2) {
                gs.clouds.splice(ci, 1);
              }

              // 퀴즈 카운트는 새 구름에 처음 착지할 때만 (stepCount === 1)
              if (cloud.stepCount === 1) {
                gs.cloudStepCount += 1;
              }

              // 점수 팝업 ID
              const pid = ++popupIdRef.current;

              // 마일스톤 체크 (퀴즈와 독립적으로)
              const milestone = SCORE_MILESTONES.find(
                m => m > gs.lastScoreMilestone && gs.score >= m,
              );
              if (milestone) {
                gs.lastScoreMilestone = milestone;
                if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
                const mMsg = MILESTONE_MESSAGES[milestone];
                setHud(h => ({ ...h, score: gs.score, scorePopup: { id: pid, value: 10 }, comboMessage: mMsg }));
                comboTimerRef.current = setTimeout(() => setHud(h => ({ ...h, comboMessage: null })), 2000);
              }

              // 퀴즈 트리거 (마일스톤과 독립적으로)
              if (gs.cloudStepCount >= gs.nextQuizAt) {
                gs.checkpointY = gs.player.y;
                gs.checkpointPlayerX = gs.player.x;
                gs.checkpointCloud = { ...cloud, stepCount: 0 };
                gs.cloudStepCount = 0;
                gs.nextQuizAt = Math.random() < 0.5 ? 7 : 8;
                gs.phase = 'quiz';
                const word = gs.shuffledWords[gs.wordIdx % gs.shuffledWords.length];
                const quiz: QuizState = { word, choices: generateChoices(word, wordsRef.current) };
                if (!milestone) setHud(h => ({ ...h, lives: gs.lives, score: gs.score, phase: 'quiz', quiz, scorePopup: { id: pid, value: 10 } }));
                else setHud(h => ({ ...h, lives: gs.lives, phase: 'quiz', quiz }));
              } else if (!milestone) {
                setHud(h => ({ ...h, score: gs.score, scorePopup: { id: pid, value: 10 } }));
              }
              break;
            }
          }
        }

        // 하트 아이템 충돌
        if (gs.heartItem) {
          const dx = gs.player.x - gs.heartItem.x;
          const dy = gs.player.y - gs.heartItem.y;
          if (Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS + 16) {
            gs.heartItem = null;
            if (gs.lives < MAX_LIVES) {
              gs.lives += 1;
              playSound('correct');
              setHud(h => ({ ...h, lives: gs.lives }));
            }
          }
        }

        // 카메라 스크롤
        if (gs.player.y < gs.cameraY + H * SCROLL_THRESHOLD) {
          gs.cameraY = gs.player.y - H * SCROLL_THRESHOLD;
        }

        // 구름 추가 생성
        while (gs.topGeneratedY > gs.cameraY - H) {
          const newY = gs.topGeneratedY - CLOUD_GAP_Y + randInt(-20, 20);
          const [dynMinW, dynMaxW] = cloudWidthRange(gs.score);
          const cw = randInt(dynMinW, dynMaxW);
          const cx = randInt(40, Math.max(41, W - cw - 40));
          gs.clouds.push(makeCloud(gs.nextCloudId++, cx, newY, cw));
          gs.topGeneratedY = newY;
        }

        // 화면 아래로 벗어난 구름 제거
        gs.clouds = gs.clouds.filter(c => c.y < gs.cameraY + H + 200);

        // 추락 감지
        if (gs.player.y > gs.cameraY + H + 100) {
          gs.lives -= 1;
          playSound('wrong');
          if (gs.lives <= 0) {
            triggerGameOver(gs);
          } else {
            gs.combo = 0;
            gs.phase = 'returning';
            gs.returningFromY = gs.checkpointY + H; // 화면 아래에서 시작하는 것처럼
            gs.returningPlayerX = gs.player.x;
            gs.player.y = gs.returningFromY;
            gs.returningFrames = 0;
            gs.player.vy = 0;
            gs.player.vx = 0;
            setHud(h => ({ ...h, lives: gs.lives, combo: 0, phase: 'returning' }));
          }
        }
      }

      // ── draw ───────────────────────────────────────────────
      const toSY = (wy: number) => wy - gs.cameraY;
      const sky = getCurrentSkyColors(gs.score);

      // 스테이지 전환 감지
      if (sky.stageName !== lastStageNameRef.current) {
        lastStageNameRef.current = sky.stageName;
        if (stageLabelTimerRef.current) clearTimeout(stageLabelTimerRef.current);
        setHud(h => ({ ...h, stageLabel: sky.label }));
        stageLabelTimerRef.current = setTimeout(
          () => setHud(h => ({ ...h, stageLabel: null })), 2000,
        );
      }

      // 배경 그라디언트 (점수에 따라 동적 변화)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, sky.top);
      grad.addColorStop(1, sky.bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 별 (night, space 스테이지)
      if (sky.stageName === 'night' || sky.stageName === 'space') {
        const baseOpacity = sky.stageName === 'space' ? 1.0 : 0.6;
        for (const star of starsRef.current) {
          const twinkle = (Math.sin(timestamp * 0.002 + star.phase) + 1) / 2;
          const opacity = baseOpacity * (0.5 + twinkle * 0.5);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(2)})`;
          ctx.fill();
        }
      }

      // 구름
      for (const cloud of gs.clouds) {
        const sy = toSY(cloud.y);
        if (sy > H + 40 || sy < -CLOUD_HEIGHT * 3) continue;
        drawCloud(ctx, cloud.x, sy, cloud.width, cloud.seed, sky.cloudColor, cloud.isCheckpoint);
      }

      // 하트 아이템
      if (gs.heartItem) {
        const hsy = toSY(gs.heartItem.y);
        if (hsy > -20 && hsy < H + 20) {
          ctx.font = '26px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❤️', gs.heartItem.x, hsy);
        }
      }

      // 캐릭터
      const px = gs.player.x;
      const py = toSY(gs.player.y);
      const charState = getCharState(gs.player.vy, landingTimerRef.current);
      const charImg = charImagesRef.current[charState];
      if (charImg?.complete && charImg.naturalWidth > 0) {
        const sq = SQUASH[charState];
        const drawW = CHARACTER_SIZE * sq.w;
        const drawH = CHARACTER_SIZE * sq.h;
        ctx.drawImage(charImg, px - drawW / 2, py - drawH / 2, drawW, drawH);
      } else {
        // 이미지 로드 전 폴백: 원
        ctx.beginPath();
        ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 퀴즈 중 어두운 오버레이
      if (gs.phase === 'quiz') {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
    // words.length: 4개 미만이면 안 시작하므로 deps에서 제외 (stable after mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hud, handleQuizAnswer, restart };
}
