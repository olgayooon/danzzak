import type { WordSet } from '../types/word';

export async function generateShareUrl(wordSet: WordSet): Promise<string> {
  if (wordSet.words.length > 200) {
    throw new Error('단어가 너무 많아요. 200개 이하로 줄여주세요.');
  }
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: wordSet.title,
      emoji: wordSet.emoji,
      theme: wordSet.theme,
      words: wordSet.words.map(w => ({ term: w.term, definition: w.definition })),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? '공유 링크 생성에 실패했어요.');
  }
  const { url } = await res.json() as { url: string };
  return url;
}
