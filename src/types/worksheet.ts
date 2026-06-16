export type WorksheetType =
  | 'fill-blank'
  | 'write-repeat'
  | 'checklist'
  | 'multiple-choice'
  | 'translation'
  | 'dictation';

export interface WorksheetConfig {
  type: WorksheetType;
  title: string;
  columns: 1 | 2;
  questionField?: 'definition' | 'term' | 'random';
  repeatCount?: number;
  includeAnswer: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  lineSpacing: 'normal' | 'wide';
  scramble: boolean;
}

export const WORKSHEET_TYPE_INFO: Record<WorksheetType, { label: string; emoji: string; description: string; phase: 1 | 2 }> = {
  'fill-blank':      { label: '빈칸 채우기', emoji: '📝', description: '뜻을 보고 빈칸에 단어 쓰기', phase: 1 },
  'write-repeat':    { label: '반복 쓰기',   emoji: '✍️', description: '단어를 여러 번 반복해 쓰기',  phase: 1 },
  checklist:         { label: '체크리스트',  emoji: '✅', description: '체크하며 외운 단어 확인',      phase: 2 },
  'multiple-choice': { label: '객관식',      emoji: '🎯', description: '4지선다 객관식 문제',          phase: 2 },
  translation:       { label: '영작 연습',   emoji: '🌐', description: '우리말 보고 영어로 쓰기',      phase: 2 },
  dictation:         { label: '받아쓰기',    emoji: '🔊', description: '들으며 단어 받아쓰기',         phase: 2 },
};
