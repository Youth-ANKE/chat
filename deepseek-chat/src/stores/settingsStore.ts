import { create } from 'zustand';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { setSoundEnabled as applySoundEnabled, playThemeToggle } from '../lib/sound';

interface SettingsState {
  settings: Settings;
  toggleDarkMode: () => void;
  setDarkMode: (on: boolean) => void;
  toggleSoundEnabled: () => void;
  setSoundEnabled: (on: boolean) => void;
  setDefaultModel: (model: Settings['defaultModel']) => void;
  setDefaultTemperature: (t: number) => void;
  setDefaultThinking: (on: boolean) => void;
  setContextLimit: (v: number) => void;
  setTopP: (v: number) => void;
  setMaxTokens: (v: number) => void;
  setStreamOutput: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },

  toggleDarkMode: () => {
    const next = !get().settings.darkMode;
    set((state) => ({ settings: { ...state.settings, darkMode: next } }));
    document.documentElement.classList.toggle('dark', next);
    playThemeToggle();
  },

  setDarkMode: (on) => {
    set((state) => ({ settings: { ...state.settings, darkMode: on } }));
    document.documentElement.classList.toggle('dark', on);
    playThemeToggle();
  },

  toggleSoundEnabled: () => {
    const next = !get().settings.soundEnabled;
    set((state) => ({ settings: { ...state.settings, soundEnabled: next } }));
    applySoundEnabled(next);
  },

  setSoundEnabled: (on) => {
    set((state) => ({ settings: { ...state.settings, soundEnabled: on } }));
    applySoundEnabled(on);
  },

  setDefaultModel: (model) =>
    set((state) => ({ settings: { ...state.settings, defaultModel: model } })),

  setDefaultTemperature: (t) =>
    set((state) => ({ settings: { ...state.settings, defaultTemperature: t } })),

  setDefaultThinking: (on) =>
    set((state) => ({ settings: { ...state.settings, defaultThinking: on } })),

  setContextLimit: (v) =>
    set((state) => ({ settings: { ...state.settings, contextLimit: v } })),

  setTopP: (v) =>
    set((state) => ({ settings: { ...state.settings, topP: v } })),

  setMaxTokens: (v) =>
    set((state) => ({ settings: { ...state.settings, maxTokens: v } })),

  setStreamOutput: (v) =>
    set((state) => ({ settings: { ...state.settings, streamOutput: v } })),
}));
