export interface Word {
  id: string;
  term: string;
  definition: string;
  isWeak: boolean;
  stats: {
    correct: number;
    wrong: number;
  };
}

export interface WordSet {
  id: string;
  title: string;
  emoji: string;
  theme: ThemePreset;
  words: Word[];
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export type ThemePreset = 'violet' | 'coral' | 'mint' | 'rose' | 'sky' | 'black';

export const THEME_PRESETS: Record<ThemePreset, { primary: string; cardBg: string; cardBorder: string; label: string }> = {
  violet: { primary: '#7C3AED', cardBg: '#F5F3FF', cardBorder: '#DDD6FE', label: 'Violet' },
  coral:  { primary: '#EA580C', cardBg: '#FFF7ED', cardBorder: '#FED7AA', label: 'Coral' },
  mint:   { primary: '#0D9488', cardBg: '#F0FDFA', cardBorder: '#99F6E4', label: 'Mint' },
  rose:   { primary: '#E11D48', cardBg: '#FFF1F2', cardBorder: '#FECDD3', label: 'Rose' },
  sky:    { primary: '#0284C7', cardBg: '#F0F9FF', cardBorder: '#BAE6FD', label: 'Sky' },
  black:  { primary: '#18181B', cardBg: '#F4F4F5', cardBorder: '#D4D4D8', label: 'Black' },
};
