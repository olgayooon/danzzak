import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  darkMode: boolean;
  ttsEnabled: boolean;
  ttsRate: number;
  soundEnabled: boolean;
  particleEnabled: boolean;
  toggleDarkMode: () => void;
  setTtsEnabled: (v: boolean) => void;
  setTtsRate: (v: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setParticleEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      darkMode: false,
      ttsEnabled: true,
      ttsRate: 1.0,
      soundEnabled: true,
      particleEnabled: true,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setTtsRate: (v) => set({ ttsRate: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setParticleEnabled: (v) => set({ particleEnabled: v }),
    }),
    { name: 'danzzak-settings' }
  )
);
