import { useEffect, useMemo } from 'react';
import { useWordSet } from './useWordSet';
import { readSharedGameSession } from '../utils/shareGame';

export function useGameWordSet(setId: string | undefined) {
  const { sets, addSet, updateWordStats } = useWordSet();

  const storedWordSet = sets.find(s => s.id === setId);
  const sharedSession = useMemo(() => {
    if (!setId?.startsWith('_shared_')) return null;
    const session = readSharedGameSession();
    return session?.tempSetId === setId ? session : null;
  }, [setId]);

  const wordSet = storedWordSet ?? sharedSession?.tempSet;

  useEffect(() => {
    if (setId?.startsWith('_shared_') && !storedWordSet && sharedSession?.tempSet) {
      addSet(sharedSession.tempSet);
    }
  }, [addSet, setId, sharedSession, storedWordSet]);

  const isSharedGame = setId?.startsWith('_shared_') ?? false;
  const returnPath = sharedSession?.returnPath ?? (setId ? `/study/${setId}` : '/');

  return {
    wordSet,
    updateWordStats,
    isSharedGame,
    returnPath,
    restorePending: false,
  };
}
