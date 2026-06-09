import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsStore {
  theme: ThemeMode;
  ttsEnabled: boolean;
  ttsRate: number;
  soundEnabled: boolean;
  particleEnabled: boolean;
  setTheme: (v: ThemeMode) => void;
  setTtsEnabled: (v: boolean) => void;
  setTtsRate: (v: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setParticleEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      ttsEnabled: true,
      ttsRate: 1.0,
      soundEnabled: true,
      particleEnabled: true,
      setTheme: (v) => set({ theme: v }),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setTtsRate: (v) => set({ ttsRate: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setParticleEnabled: (v) => set({ particleEnabled: v }),
    }),
    { name: 'danzzak-settings' }
  )
);
