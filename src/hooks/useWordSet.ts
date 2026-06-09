import { useWordSetStore } from '../store/wordSetStore';
import type { WordSet, Word, Folder } from '../types/word';
import { generateId } from '../utils/id';

export function useWordSet() {
  const {
    sets, folders, activeSetId,
    addSet, updateSet, deleteSet, setActiveSetId, getActiveSet,
    addFolder, updateFolder, deleteFolder, moveSetToFolder,
  } = useWordSetStore();

  function createSet(title: string, words: Word[], emoji = '📚', theme: WordSet['theme'] = 'violet'): WordSet {
    const now = new Date().toISOString();
    const newSet: WordSet = {
      id: generateId(),
      title,
      emoji,
      theme,
      words,
      createdAt: now,
      updatedAt: now,
    };
    addSet(newSet);
    setActiveSetId(newSet.id);
    return newSet;
  }

  function saveSet(set: WordSet) {
    updateSet({ ...set, updatedAt: new Date().toISOString() });
  }

  function updateWordStats(setId: string, wordId: string, correct: boolean) {
    const target = sets.find(s => s.id === setId);
    if (!target) return;
    const updatedWords = target.words.map(w => {
      if (w.id !== wordId) return w;
      const stats = {
        correct: w.stats.correct + (correct ? 1 : 0),
        wrong: w.stats.wrong + (correct ? 0 : 1),
      };
      const total = stats.correct + stats.wrong;
      const accuracy = total > 0 ? stats.correct / total : 1;
      return { ...w, stats, isWeak: accuracy < 0.6 && total >= 3 };
    });
    updateSet({ ...target, words: updatedWords, updatedAt: new Date().toISOString() });
  }

  function createFolder(name: string, emoji = '📁'): Folder {
    const folder: Folder = {
      id: generateId(),
      name,
      emoji,
      createdAt: new Date().toISOString(),
    };
    addFolder(folder);
    return folder;
  }

  return {
    sets,
    folders,
    activeSetId,
    activeSet: getActiveSet(),
    addSet,
    setActiveSetId,
    createSet,
    saveSet,
    deleteSet,
    updateWordStats,
    createFolder,
    updateFolder,
    deleteFolder,
    moveSetToFolder,
  };
}
