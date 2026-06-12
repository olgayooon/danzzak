import { useRef, useState, useEffect, useCallback } from 'react';
import type { RefObject } from 'react';
import type { Word } from '../types/word';
import type { GameResult } from '../types/game';
import { shuffleArray, generateChoices } from '../utils/gameUtils';
import { playSound } from '../utils/feedback';

// ── 상수 ────────────────────────────────────────────────────────
const GRAVITY = 0.2;
const JUMP_FORCE = -13;
const PLAYER_RADIUS = 18;
const CLOUD_GAP_Y = 90;
const CLOUD_HEIGHT = 20;
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
  return { id, x, y, width, height: CLOUD_HEIGHT, isCheckpoint, stepCount: 0 };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    const ri = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + ri, y);
    ctx.lineTo(x + w - ri, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + ri);
    ctx.lineTo(x + w, y + h - ri);
    ctx.quadraticCurveTo(x + w, y + h, x + w - ri, y + h);
    ctx.lineTo(x + ri, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - ri);
    ctx.lineTo(x, y + ri);
    ctx.quadraticCurveTo(x, y, x + ri, y);
    ctx.closePath();
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

  // stable refs so loop closure doesn't go stale
  const onFinishRef = useRef(onFinish);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  const setIdRef = useRef(setId);
  useEffect(() => { setIdRef.current = setId; }, [setId]);
  const wordsRef = useRef(words);
  useEffect(() => { wordsRef.current = words; }, [words]);

  const [hud, setHud] = useState<HUDState>({
    lives: MAX_LIVES, score: 0, combo: 0,
    phase: 'playing', comboMessage: null, quiz: null,
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
    setHud({ lives: MAX_LIVES, score: 0, combo: 0, phase: 'playing', comboMessage: null, quiz: null });
  }, [canvasRef]);

  // ── RAF 루프 (setup once) ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || words.length < 4) return;

    // 배경 그라디언트 캐시 (매 프레임 생성 방지)
    let cachedGrad: CanvasGradient | null = null;
    let cachedGradH = 0;

    // Canvas 크기 초기화
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 56;
      cachedGrad = null; // 크기 변경 시 그라디언트 재생성
      if (!gsRef.current) {
        gsRef.current = initGS(wordsRef.current, canvas.width, canvas.height);
        setHud({ lives: MAX_LIVES, score: 0, combo: 0, phase: 'playing', comboMessage: null, quiz: null });
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

        // 구름 충돌 (낙하 중일 때만)
        if (gs.player.vy > 0) {
          const pBottom = gs.player.y + PLAYER_RADIUS;
          const prevBottom = pBottom - gs.player.vy * dt;

          for (let ci = 0; ci < gs.clouds.length; ci++) {
            const cloud = gs.clouds[ci];
            if (
              prevBottom <= cloud.y + 4 &&
              pBottom >= cloud.y &&
              pBottom <= cloud.y + cloud.height + 10 &&
              gs.player.x >= cloud.x - PLAYER_RADIUS * 0.5 &&
              gs.player.x <= cloud.x + cloud.width + PLAYER_RADIUS * 0.5
            ) {
              gs.player.y = cloud.y - PLAYER_RADIUS;
              gs.player.vy = JUMP_FORCE;
              gs.score += 10;
              gs.lastLandedCloudId = cloud.id;
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

      // 배경 그라디언트 (캐시 — 높이가 바뀔 때만 재생성)
      if (!cachedGrad || cachedGradH !== H) {
        cachedGrad = ctx.createLinearGradient(0, 0, 0, H);
        cachedGrad.addColorStop(0, '#55b3ff');
        cachedGrad.addColorStop(1, '#c5e1ff');
        cachedGradH = H;
      }
      ctx.fillStyle = cachedGrad;
      ctx.fillRect(0, 0, W, H);

      // 구름
      for (const cloud of gs.clouds) {
        const sy = toSY(cloud.y);
        if (sy > H + 20 || sy < -cloud.height - 20) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        roundRect(ctx, cloud.x, sy, cloud.width, cloud.height, 8);
        ctx.fill();
        if (cloud.isCheckpoint) {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
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
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 3;
      ctx.stroke();

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
