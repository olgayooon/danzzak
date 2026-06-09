import type { WordSet, ThemePreset } from '../types/word';
import type { GameMode } from '../types/game';

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

export function buildGameShareUrl(
  set: WordSet,
  gameMode: GameMode,
  questionType?: 'term' | 'definition' | 'mixed',
): string {
  const payload: GameSharePayload = {
    title: set.title,
    emoji: set.emoji,
    theme: set.theme,
    words: set.words.map(w => ({ term: w.term, definition: w.definition })),
    gameMode,
    ...(questionType ? { questionType } : {}),
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  return `${window.location.origin}/shared/game#${encoded}`;
}

export function decodeGameShare(hash: string): GameSharePayload | null {
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
