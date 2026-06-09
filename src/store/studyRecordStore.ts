import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameResult } from '../types/game';

interface StudyRecordStore {
  records: GameResult[];
  addRecord: (result: GameResult) => void;
  getRecordsBySet: (setId: string) => GameResult[];
}

export const useStudyRecordStore = create<StudyRecordStore>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (result) =>
        set(state => ({
          records: [result, ...state.records].slice(0, 100),
        })),
      getRecordsBySet: (setId) =>
        get().records.filter(r => r.setId === setId),
    }),
    { name: 'danzzak-study-records' }
  )
);
