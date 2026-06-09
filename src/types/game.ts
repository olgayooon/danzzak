import type { Word } from './word';

export type GameMode =
  | 'flashcard'
  | 'fill-in'
  | 'multiple-choice'
  | 'matching'
  | 'falling'
  | 'speed-quiz'
  | 'cloud-jump'
  | 'typewriter'
  | 'missing-letters';

export interface GameResult {
  setId: string;
  mode: GameMode;
  correct: number;
  wrong: number;
  duration: number;
  combo: number;
  playedAt: string;
  score?: number;
  wrongWords?: Word[];  // 오답 단어 목록 (빈칸/4지선다 결과 화면용)
}

export const GAME_MODE_INFO: Record<GameMode, { label: string; emoji: string; description: string; phase: 1 | 2 | 3 }> = {
  flashcard:        { label: '플래시카드', emoji: '🃏', description: '카드를 뒤집어 뜻을 확인해요', phase: 1 },
  'fill-in':        { label: '빈칸 채우기', emoji: '✏️', description: '뜻을 보고 단어를 직접 입력해요', phase: 2 },
  'multiple-choice':{ label: '4지선다', emoji: '🎯', description: '4개 중 올바른 뜻을 선택해요', phase: 2 },
  matching:         { label: '매칭', emoji: '🔗', description: '단어와 뜻을 연결해요', phase: 3 },
  falling:          { label: '크래싱', emoji: '⚡', description: '떨어지는 단어를 빠르게 맞춰요', phase: 3 },
  'speed-quiz':     { label: '스피드 퀴즈', emoji: '🚀', description: '타이머를 이기며 빠르게 풀어요', phase: 3 },
  'cloud-jump':     { label: '구름 점프', emoji: '☁️', description: '구름을 밟으며 단어 퀴즈를 풀어요', phase: 3 },
  typewriter:       { label: '타이핑 암기', emoji: '⌨️', description: '사라진 단어를 기억해서 타이핑해요', phase: 3 },
  'missing-letters':{ label: '빈칸 채우기(스펠)', emoji: '🔤', description: '빠진 철자를 채워 단어를 완성해요', phase: 3 },
};
