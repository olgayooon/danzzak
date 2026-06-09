import type { WordSet, ThemePreset } from '../types/word';
import type { Word } from '../types/word';

interface WordSetSharePayload {
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: { term: string; definition: string }[];
}

export function buildWordSetShareUrl(set: WordSet): string {
  const payload: WordSetSharePayload = {
    title: set.title,
    emoji: set.emoji,
    theme: set.theme,
    words: set.words.map(w => ({ term: w.term, definition: w.definition })),
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
  return `${window.location.origin}/shared/set#${encoded}`;
}

export function decodeWordSetShare(hash: string): WordSetSharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(hash))) as WordSetSharePayload;
  } catch {
    return null;
  }
}

export type { WordSetSharePayload, Word };
