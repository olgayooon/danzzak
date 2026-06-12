import { useWordSet } from './useWordSet';

export function useGameWordSet(setId: string | undefined) {
  const { sets, updateWordStats } = useWordSet();

  const wordSet = sets.find(s => s.id === setId);
  const returnPath = setId ? `/study/${setId}` : '/';

  return {
    wordSet,
    updateWordStats,
    isSharedGame: false,
    returnPath,
    restorePending: false,
  };
}
