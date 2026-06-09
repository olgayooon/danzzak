import type { Word } from '../types/word';

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateWrongAnswers(correct: Word, allWords: Word[], count = 3): string[] {
  const pool = allWords.filter(w => w.id !== correct.id).map(w => w.definition);
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count);
}

export function generateChoices(
  correct: Word,
  allWords: Word[],
  questionType: 'term' | 'definition' = 'term',
): string[] {
  if (questionType === 'definition') {
    const pool = shuffleArray(allWords.filter(w => w.id !== correct.id).map(w => w.term));
    return shuffleArray([correct.term, ...pool.slice(0, 3)]);
  }
  const wrong = generateWrongAnswers(correct, allWords);
  return shuffleArray([correct.definition, ...wrong]);
}

/** 모바일 크래싱 게임용: 정답 term + 오답 term 3개 */
export function generateTermChoices(correct: Word, allWords: Word[]): string[] {
  const pool = shuffleArray(allWords.filter(w => w.id !== correct.id).map(w => w.term));
  return shuffleArray([correct.term, ...pool.slice(0, 3)]);
}
