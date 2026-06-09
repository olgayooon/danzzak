import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WordSet, Folder } from '../types/word';

interface WordSetStore {
  sets: WordSet[];
  folders: Folder[];
  activeSetId: string | null;
  addSet: (set: WordSet) => void;
  updateSet: (set: WordSet) => void;
  deleteSet: (id: string) => void;
  setActiveSetId: (id: string | null) => void;
  getActiveSet: () => WordSet | undefined;
  addFolder: (folder: Folder) => void;
  updateFolder: (folder: Folder) => void;
  deleteFolder: (id: string) => void;
  moveSetToFolder: (setId: string, folderId: string | null) => void;
}

export const useWordSetStore = create<WordSetStore>()(
  persist(
    (set, get) => ({
      sets: [],
      folders: [],
      activeSetId: null,

      addSet: (wordSet) =>
        set(state => ({
          sets: [wordSet, ...state.sets.filter(s => s.id !== wordSet.id)].slice(0, 50),
        })),

      updateSet: (wordSet) =>
        set(state => ({
          sets: state.sets.map(s => (s.id === wordSet.id ? wordSet : s)),
        })),

      deleteSet: (id) =>
        set(state => ({
          sets: state.sets.filter(s => s.id !== id),
          activeSetId: state.activeSetId === id ? null : state.activeSetId,
        })),

      setActiveSetId: (id) => set({ activeSetId: id }),

      getActiveSet: () => {
        const { sets, activeSetId } = get();
        return sets.find(s => s.id === activeSetId);
      },

      addFolder: (folder) =>
        set(state => ({ folders: [...state.folders, folder] })),

      updateFolder: (folder) =>
        set(state => ({
          folders: state.folders.map(f => (f.id === folder.id ? folder : f)),
        })),

      deleteFolder: (id) =>
        set(state => ({
          folders: state.folders.filter(f => f.id !== id),
          // 폴더 삭제 시 해당 폴더의 단어장은 미분류로
          sets: state.sets.map(s =>
            s.folderId === id ? { ...s, folderId: undefined } : s
          ),
        })),

      moveSetToFolder: (setId, folderId) =>
        set(state => ({
          sets: state.sets.map(s =>
            s.id === setId
              ? { ...s, folderId: folderId ?? undefined }
              : s
          ),
        })),
    }),
    { name: 'danzzak-word-sets' }
  )
);
