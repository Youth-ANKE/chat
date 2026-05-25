import { create } from 'zustand';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { setSoundEnabled as applySoundEnabled, playThemeToggle } from '../lib/sound';
import { setSpeechEnabled as applySpeechEnabled, setSpeechVoice as applySpeechVoice } from '../lib/speech';
import { setMusicEnabled as applyMusicEnabled, setMusicMode as applyMusicMode, setMusicVolume as applyMusicVolume, type MusicMode } from '../lib/music';

interface SettingsState {
  settings: Settings;
  toggleDarkMode: () => void;
  setDarkMode: (on: boolean) => void;
  toggleSoundEnabled: () => void;
  setSoundEnabled: (on: boolean) => void;
  toggleSpeechEnabled: () => void;
  setSpeechEnabled: (on: boolean) => void;
  setSpeechVoice: (voiceURI: string) => void;
  toggleSpeechVoiceFavorite: (voiceURI: string) => void;
  toggleMusicEnabled: () => void;
  setMusicEnabled: (on: boolean) => void;
  setMusicMode: (mode: MusicMode) => void;
  setMusicVolume: (vol: number) => void;
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

  toggleSpeechEnabled: () => {
    const next = !get().settings.speechEnabled;
    set((state) => ({ settings: { ...state.settings, speechEnabled: next } }));
    applySpeechEnabled(next);
  },

  setSpeechEnabled: (on) => {
    set((state) => ({ settings: { ...state.settings, speechEnabled: on } }));
    applySpeechEnabled(on);
  },

  setSpeechVoice: (voiceURI) => {
    set((state) => ({ settings: { ...state.settings, speechVoice: voiceURI } }));
    applySpeechVoice(voiceURI);
  },

  toggleSpeechVoiceFavorite: (voiceURI) => {
    set((state) => {
      const favs = state.settings.favoriteVoices;
      const next = favs.includes(voiceURI)
        ? favs.filter((v) => v !== voiceURI)
        : [...favs, voiceURI];
      return { settings: { ...state.settings, favoriteVoices: next } };
    });
  },

  toggleMusicEnabled: () => {
    const next = !get().settings.musicEnabled;
    set((state) => ({ settings: { ...state.settings, musicEnabled: next } }));
    applyMusicEnabled(next);
  },

  setMusicEnabled: (on) => {
    set((state) => ({ settings: { ...state.settings, musicEnabled: on } }));
    applyMusicEnabled(on);
  },

  setMusicMode: (mode) => {
    set((state) => ({ settings: { ...state.settings, musicMode: mode } }));
    applyMusicMode(mode);
  },

  setMusicVolume: (vol) => {
    set((state) => ({ settings: { ...state.settings, musicVolume: vol } }));
    applyMusicVolume(vol);
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
