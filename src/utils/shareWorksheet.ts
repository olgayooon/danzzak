import type { WorksheetConfig } from '../types/worksheet';
import type { Word } from '../types/word';
import { encodeCompressed, decodeCompressed } from './compress';

interface SharePayload {
  config: WorksheetConfig;
  words: { term: string; definition: string }[];
  setTitle: string;
}

// Word[] 를 받아서 term/definition만 추출 후 인코딩
export function buildShareUrl(payload: { config: WorksheetConfig; words: Word[]; setTitle: string }): string {
  const slim: SharePayload = {
    config: payload.config,
    words: payload.words.map(w => ({ term: w.term, definition: w.definition })),
    setTitle: payload.setTitle,
  };
  return `${window.location.origin}/share/worksheet#${encodeCompressed(slim)}`;
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  // 신버전: 압축
  const result = decodeCompressed<SharePayload>(encoded);
  if (result) return result;
  // 구버전 v0: btoa + escape
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as SharePayload;
  } catch {
    return null;
  }
}

export function encodeSharePayload(payload: { config: WorksheetConfig; words: Word[]; setTitle: string }): string {
  return buildShareUrl(payload).split('#')[1];
}
