import type { WordSet, ThemePreset } from '../types/word';
import type { Word } from '../types/word';
import { encodeCompressed, decodeCompressed } from './compress';

interface WordSetSharePayload {
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: { term: string; definition: string }[];
}

// 컴팩트 포맷: [title, emoji, theme, [[term, def], ...]]
type CompactPayload = [string, string, ThemePreset, [string, string][]];

function toCompact(p: WordSetSharePayload): CompactPayload {
  return [p.title, p.emoji, p.theme, p.words.map(w => [w.term, w.definition])];
}

function fromCompact(c: CompactPayload): WordSetSharePayload {
  return { title: c[0], emoji: c[1], theme: c[2], words: c[3].map(([term, definition]) => ({ term, definition })) };
}

/** 서버 단축 링크 생성 (단어장 공유용) — /s/:code 형태 반환 */
export async function generateShareUrl(set: WordSet): Promise<string> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: set.title,
      words: set.words.map(w => ({ term: w.term, definition: w.definition })),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? '공유 링크 생성에 실패했어요.');
  }
  const { url } = await res.json() as { url: string };
  return url;
}

/** 긴 URL 방식 (게임 공유 등 서버 없이 빠르게 필요할 때 유지) */
export function buildWordSetShareUrl(set: WordSet): string {
  const payload: WordSetSharePayload = {
    title: set.title,
    emoji: set.emoji,
    theme: set.theme,
    words: set.words.map(w => ({ term: w.term, definition: w.definition })),
  };
  return `${window.location.origin}/shared/set#${encodeCompressed(toCompact(payload))}`;
}

export function decodeWordSetShare(hash: string): WordSetSharePayload | null {
  // 신버전: 압축된 컴팩트 배열
  const compact = decodeCompressed<CompactPayload>(hash);
  if (compact && Array.isArray(compact)) return fromCompact(compact);
  // 구버전 v1: 압축된 객체
  const obj = decodeCompressed<WordSetSharePayload>(hash);
  if (obj && obj.title) return obj;
  // 구버전 v0: btoa + encodeURIComponent
  try {
    return JSON.parse(decodeURIComponent(atob(hash))) as WordSetSharePayload;
  } catch {
    return null;
  }
}

export type { WordSetSharePayload, Word };
