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

interface ThemeColors {
  primary: string;
  cardBg: string;
  cardBorder: string;
  cardBgDark: string;
  cardBorderDark: string;
  label: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  violet: { primary: '#7C3AED', cardBg: '#F5F3FF', cardBorder: '#DDD6FE', cardBgDark: '#1E1533', cardBorderDark: '#3B2D6B', label: 'Violet' },
  coral:  { primary: '#EA580C', cardBg: '#FFF7ED', cardBorder: '#FED7AA', cardBgDark: '#1F1008', cardBorderDark: '#6B2C0A', label: 'Coral' },
  mint:   { primary: '#0D9488', cardBg: '#F0FDFA', cardBorder: '#99F6E4', cardBgDark: '#061514', cardBorderDark: '#0E4D47', label: 'Mint' },
  rose:   { primary: '#E11D48', cardBg: '#FFF1F2', cardBorder: '#FECDD3', cardBgDark: '#1C0A10', cardBorderDark: '#6B1028', label: 'Rose' },
  sky:    { primary: '#0284C7', cardBg: '#F0F9FF', cardBorder: '#BAE6FD', cardBgDark: '#060F19', cardBorderDark: '#0A3657', label: 'Sky' },
  black:  { primary: '#52525B', cardBg: '#F4F4F5', cardBorder: '#D4D4D8', cardBgDark: '#18181B', cardBorderDark: '#3F3F46', label: 'Black' },
};

export type ThemeActiveColors = Omit<ThemeColors, 'cardBgDark' | 'cardBorderDark'>;

/** isDark에 따라 적절한 카드 배경/테두리 색을 반환 */
export function getTheme(preset: ThemePreset, isDark: boolean): ThemeActiveColors {
  const p = THEME_PRESETS[preset];
  return {
    primary: p.primary,
    cardBg: isDark ? p.cardBgDark : p.cardBg,
    cardBorder: isDark ? p.cardBorderDark : p.cardBorder,
    label: p.label,
  };
}
