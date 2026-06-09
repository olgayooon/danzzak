import type { WorksheetConfig } from '../types/worksheet';
import type { Word } from '../types/word';

interface SharePayload {
  config: WorksheetConfig;
  words: Word[];
  setTitle: string;
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(payload: SharePayload): string {
  const encoded = encodeSharePayload(payload);
  const base = `${window.location.origin}/share/worksheet`;
  return `${base}#${encoded}`;
}
