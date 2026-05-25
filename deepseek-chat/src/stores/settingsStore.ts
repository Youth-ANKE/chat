import { create } from 'zustand';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  settings: Settings;
  toggleDarkMode: () => void;
  setDarkMode: (on: boolean) => void;
  setDefaultModel: (model: Settings['defaultModel']) => void;
  setDefaultTemperature: (t: number) => void;
  setDefaultThinking: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },

  toggleDarkMode: () => {
    const next = !get().settings.darkMode;
    set((state) => ({ settings: { ...state.settings, darkMode: next } }));
    document.documentElement.classList.toggle('dark', next);
  },

  setDarkMode: (on) => {
    set((state) => ({ settings: { ...state.settings, darkMode: on } }));
    document.documentElement.classList.toggle('dark', on);
  },

  setDefaultModel: (model) =>
    set((state) => ({ settings: { ...state.settings, defaultModel: model } })),

  setDefaultTemperature: (t) =>
    set((state) => ({ settings: { ...state.settings, defaultTemperature: t } })),

  setDefaultThinking: (on) =>
    set((state) => ({ settings: { ...state.settings, defaultThinking: on } })),
}));
