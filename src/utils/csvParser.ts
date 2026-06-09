import type { Word } from '../types/word';
import { generateId } from './id';

export function parseCsv(text: string): Word[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const words: Word[] = [];

  for (const line of lines) {
    // 탭 구분 먼저, 없으면 콤마 구분
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length >= 2) {
      const term = parts[0].trim().replace(/^["']|["']$/g, '');
      const definition = parts[1].trim().replace(/^["']|["']$/g, '');
      if (term && definition) {
        words.push({
          id: generateId(),
          term,
          definition,
          isWeak: false,
          stats: { correct: 0, wrong: 0 },
        });
      }
    }
  }
  return words;
}
