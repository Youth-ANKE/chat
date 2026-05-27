import { create } from 'zustand';
import type { Settings, AccentColor, Language } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { setSoundEnabled as applySoundEnabled, playThemeToggle } from '../lib/sound';
import { setSpeechEnabled as applySpeechEnabled, setSpeechVoice as applySpeechVoice } from '../lib/speech';
import { setMusicEnabled as applyMusicEnabled, setMusicMode as applyMusicMode, setMusicVolume as applyMusicVolume, type MusicMode } from '../lib/music';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'deepseek_settings_v2';

/** Load persisted settings, merged with defaults for new fields */
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* quota exceeded, ignore */ }
}

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
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: Settings['fontSize']) => void;
  setShowTimestamps: (on: boolean) => void;
  setNotificationsEnabled: (on: boolean) => void;
  setAutoTitleAI: (on: boolean) => void;
  setShowContextBar: (on: boolean) => void;
  setLanguage: (lang: Language) => void;
  setDefaultProviderId: (id: string) => void;
  setVoiceAutoSend: (on: boolean) => void;
  setShowArchived: (on: boolean) => void;
  setCustomShortcuts: (shortcuts: Record<string, string>) => void;
  /** Export settings as JSON string */
  exportSettings: () => string;
  /** Import settings from JSON string, returns success */
  importSettings: (json: string) => boolean;
  /** Reset all settings to defaults */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),

  // ── Theme ──
  toggleDarkMode: () => {
    const next = !get().settings.darkMode;
    set((state) => {
      const s = { ...state.settings, darkMode: next };
      persistSettings(s);
      return { settings: s };
    });
    document.documentElement.classList.toggle('dark', next);
    playThemeToggle();
  },

  setDarkMode: (on) => {
    set((state) => {
      const s = { ...state.settings, darkMode: on };
      persistSettings(s);
      return { settings: s };
    });
    document.documentElement.classList.toggle('dark', on);
    playThemeToggle();
  },

  // ── Sound ──
  toggleSoundEnabled: () => {
    const next = !get().settings.soundEnabled;
    set((state) => {
      const s = { ...state.settings, soundEnabled: next };
      persistSettings(s);
      return { settings: s };
    });
    applySoundEnabled(next);
  },

  setSoundEnabled: (on) => {
    set((state) => {
      const s = { ...state.settings, soundEnabled: on };
      persistSettings(s);
      return { settings: s };
    });
    applySoundEnabled(on);
  },

  // ── Speech ──
  toggleSpeechEnabled: () => {
    const next = !get().settings.speechEnabled;
    set((state) => {
      const s = { ...state.settings, speechEnabled: next };
      persistSettings(s);
      return { settings: s };
    });
    applySpeechEnabled(next);
  },

  setSpeechEnabled: (on) => {
    set((state) => {
      const s = { ...state.settings, speechEnabled: on };
      persistSettings(s);
      return { settings: s };
    });
    applySpeechEnabled(on);
  },

  setSpeechVoice: (voiceURI) => {
    set((state) => {
      const s = { ...state.settings, speechVoice: voiceURI };
      persistSettings(s);
      return { settings: s };
    });
    applySpeechVoice(voiceURI);
  },

  toggleSpeechVoiceFavorite: (voiceURI) => {
    set((state) => {
      const favs = state.settings.favoriteVoices;
      const next = favs.includes(voiceURI)
        ? favs.filter((v) => v !== voiceURI)
        : [...favs, voiceURI];
      const s = { ...state.settings, favoriteVoices: next };
      persistSettings(s);
      return { settings: s };
    });
  },

  // ── Music ──
  toggleMusicEnabled: () => {
    const next = !get().settings.musicEnabled;
    set((state) => {
      const s = { ...state.settings, musicEnabled: next };
      persistSettings(s);
      return { settings: s };
    });
    applyMusicEnabled(next);
  },

  setMusicEnabled: (on) => {
    set((state) => {
      const s = { ...state.settings, musicEnabled: on };
      persistSettings(s);
      return { settings: s };
    });
    applyMusicEnabled(on);
  },

  setMusicMode: (mode) => {
    set((state) => {
      const s = { ...state.settings, musicMode: mode };
      persistSettings(s);
      return { settings: s };
    });
    applyMusicMode(mode);
  },

  setMusicVolume: (vol) => {
    set((state) => {
      const s = { ...state.settings, musicVolume: vol };
      persistSettings(s);
      return { settings: s };
    });
    applyMusicVolume(vol);
  },

  // ── Model defaults ──
  setDefaultModel: (model) =>
    set((state) => {
      const s = { ...state.settings, defaultModel: model };
      persistSettings(s);
      return { settings: s };
    }),

  setDefaultTemperature: (t) =>
    set((state) => {
      const s = { ...state.settings, defaultTemperature: t };
      persistSettings(s);
      return { settings: s };
    }),

  setDefaultThinking: (on) =>
    set((state) => {
      const s = { ...state.settings, defaultThinking: on };
      persistSettings(s);
      return { settings: s };
    }),

  setContextLimit: (v) =>
    set((state) => {
      const s = { ...state.settings, contextLimit: v };
      persistSettings(s);
      return { settings: s };
    }),

  setTopP: (v) =>
    set((state) => {
      const s = { ...state.settings, topP: v };
      persistSettings(s);
      return { settings: s };
    }),

  setMaxTokens: (v) =>
    set((state) => {
      const s = { ...state.settings, maxTokens: v };
      persistSettings(s);
      return { settings: s };
    }),

  setStreamOutput: (v) =>
    set((state) => {
      const s = { ...state.settings, streamOutput: v };
      persistSettings(s);
      return { settings: s };
    }),

  // ── New settings ──
  setAccentColor: (color) =>
    set((state) => {
      const s = { ...state.settings, accentColor: color };
      persistSettings(s);
      return { settings: s };
    }),

  setFontSize: (size) =>
    set((state) => {
      const s = { ...state.settings, fontSize: size };
      persistSettings(s);
      return { settings: s };
    }),

  setShowTimestamps: (on) =>
    set((state) => {
      const s = { ...state.settings, showTimestamps: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Notifications ──
  setNotificationsEnabled: (on: boolean) =>
    set((state) => {
      const s = { ...state.settings, notificationsEnabled: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Auto title AI ──
  setAutoTitleAI: (on: boolean) =>
    set((state) => {
      const s = { ...state.settings, autoTitleAI: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Context bar ──
  setShowContextBar: (on: boolean) =>
    set((state) => {
      const s = { ...state.settings, showContextBar: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Language ──
  setLanguage: (lang: Language) =>
    set((state) => {
      const s = { ...state.settings, language: lang };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Default Provider ──
  setDefaultProviderId: (id: string) =>
    set((state) => {
      const s = { ...state.settings, defaultProviderId: id };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Voice Auto-Send ──
  setVoiceAutoSend: (on: boolean) =>
    set((state) => {
      const s = { ...state.settings, voiceAutoSend: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Show Archived ──
  setShowArchived: (on: boolean) =>
    set((state) => {
      const s = { ...state.settings, showArchived: on };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Custom Shortcuts ──
  setCustomShortcuts: (shortcuts: Record<string, string>) =>
    set((state) => {
      const s = { ...state.settings, customShortcuts: shortcuts };
      persistSettings(s);
      return { settings: s };
    }),

  // ── Import / Export / Reset ──
  exportSettings: () => {
    return JSON.stringify(get().settings, null, 2);
  },

  importSettings: (json) => {
    try {
      const parsed = JSON.parse(json);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      set({ settings: merged });
      persistSettings(merged);
      // Apply side effects
      document.documentElement.classList.toggle('dark', merged.darkMode);
      applySoundEnabled(merged.soundEnabled);
      if (merged.musicEnabled) applyMusicEnabled(true);
      else applyMusicEnabled(false);
      if (merged.speechEnabled) applySpeechEnabled(true);
      return true;
    } catch {
      return false;
    }
  },

  resetSettings: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    persistSettings(DEFAULT_SETTINGS);
    document.documentElement.classList.toggle('dark', DEFAULT_SETTINGS.darkMode);
    applySoundEnabled(DEFAULT_SETTINGS.soundEnabled);
    applyMusicEnabled(false);
    applySpeechEnabled(false);
  },
}));
