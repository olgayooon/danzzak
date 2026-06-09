import { useStudyRecordStore } from '../store/studyRecordStore';
import type { GameResult } from '../types/game';

export function useStudyRecord() {
  const { records, addRecord, getRecordsBySet } = useStudyRecordStore();
  return { records, addRecord, getRecordsBySet };
}

export function calcAccuracy(result: Pick<GameResult, 'correct' | 'wrong'>): number {
  const total = result.correct + result.wrong;
  return total === 0 ? 0 : Math.round((result.correct / total) * 100);
}
