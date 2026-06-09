import type { WordSet, ThemePreset } from '../types/word';
import type { GameMode } from '../types/game';
import { encodeCompressed, decodeCompressed } from './compress';

export const SHARED_GAME_SESSION_KEY = 'danzzak-shared-session';

interface GameSharePayload {
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: { term: string; definition: string }[];
  gameMode: GameMode;
  questionType?: 'term' | 'definition' | 'mixed';
}

export interface SharedGameSession {
  nickname: string;
  pin: string;
  shareHash: string;
  tempSetId: string;
  returnPath: string;
  tempSet: WordSet;
  questionType?: 'term' | 'definition' | 'mixed';
}

// 컴팩트 포맷: [title, emoji, theme, [[term,def],...], gameMode, questionType?]
type CompactPayload = [string, string, ThemePreset, [string, string][], GameMode, ('term' | 'definition' | 'mixed')?];

function toCompact(p: GameSharePayload): CompactPayload {
  const base: CompactPayload = [p.title, p.emoji, p.theme, p.words.map(w => [w.term, w.definition]), p.gameMode];
  if (p.questionType) base.push(p.questionType);
  return base;
}

function fromCompact(c: CompactPayload): GameSharePayload {
  return {
    title: c[0], emoji: c[1], theme: c[2],
    words: c[3].map(([term, definition]) => ({ term, definition })),
    gameMode: c[4],
    ...(c[5] ? { questionType: c[5] } : {}),
  };
}

export function buildGameShareUrl(
  set: WordSet,
  gameMode: GameMode,
  questionType?: 'term' | 'definition' | 'mixed',
): string {
  const payload: GameSharePayload = {
    title: set.title, emoji: set.emoji, theme: set.theme,
    words: set.words.map(w => ({ term: w.term, definition: w.definition })),
    gameMode,
    ...(questionType ? { questionType } : {}),
  };
  return `${window.location.origin}/shared/game#${encodeCompressed(toCompact(payload))}`;
}

export function decodeGameShare(hash: string): GameSharePayload | null {
  // 신버전: 압축된 컴팩트 배열
  const compact = decodeCompressed<CompactPayload>(hash);
  if (compact && Array.isArray(compact)) return fromCompact(compact);
  // 구버전 v1: 압축된 객체
  const obj = decodeCompressed<GameSharePayload>(hash);
  if (obj && obj.title) return obj;
  // 구버전 v0: btoa + encodeURIComponent
  try {
    return JSON.parse(decodeURIComponent(atob(hash))) as GameSharePayload;
  } catch {
    return null;
  }
}

export function readSharedGameSession(): SharedGameSession | null {
  try {
    const raw = sessionStorage.getItem(SHARED_GAME_SESSION_KEY);
    return raw ? JSON.parse(raw) as SharedGameSession : null;
  } catch {
    return null;
  }
}

export type { GameSharePayload };
