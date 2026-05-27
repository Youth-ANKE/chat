import { create } from 'zustand';
import type { ModelProvider, ProviderModel } from '../types';
import { BUILTIN_PROVIDERS } from '../lib/provider-adapter';

const STORAGE_KEY = 'deepseek_providers_v1';

function loadProviders(): ModelProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...BUILTIN_PROVIDERS];
    const parsed = JSON.parse(raw) as ModelProvider[];
    // Merge with builtin: add any new default providers
    const merged = [...BUILTIN_PROVIDERS];
    for (const saved of parsed) {
      const idx = merged.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...saved, models: saved.models ?? merged[idx].models };
      } else {
        merged.push(saved);
      }
    }
    return merged;
  } catch {
    return [...BUILTIN_PROVIDERS];
  }
}

function persistProviders(providers: ModelProvider[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  } catch { /* ignore */ }
}

interface ProviderState {
  providers: ModelProvider[];
  /** Toggle provider enabled/disabled */
  toggleProvider: (id: string) => void;
  /** Set provider API key */
  setApiKey: (id: string, key: string) => void;
  /** Set provider base URL */
  setBaseUrl: (id: string, url: string) => void;
  /** Add a custom provider */
  addProvider: (provider: ModelProvider) => void;
  /** Remove a custom provider (builtin ones only disable) */
  removeProvider: (id: string) => void;
  /** Add a model to a provider */
  addModel: (providerId: string, model: ProviderModel) => void;
  /** Remove a model from a provider */
  removeModel: (providerId: string, modelId: string) => void;
  /** Batch replace all models for a provider */
  setModels: (providerId: string, models: ProviderModel[]) => void;
  /** Get all enabled providers */
  getEnabled: () => ModelProvider[];
  /** Export providers as JSON */
  exportProviders: () => string;
  /** Import providers from JSON */
  importProviders: (json: string) => boolean;
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: loadProviders(),

  toggleProvider: (id) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  setApiKey: (id, key) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === id ? { ...p, apiKey: key } : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  setBaseUrl: (id, url) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === id ? { ...p, baseUrl: url } : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  addProvider: (provider) =>
    set((state) => {
      const next = [...state.providers, provider];
      persistProviders(next);
      return { providers: next };
    }),

  removeProvider: (id) => {
    const isBuiltin = BUILTIN_PROVIDERS.some((p) => p.id === id);
    if (isBuiltin) {
      // Just disable it
      get().toggleProvider(id);
    } else {
      set((state) => {
        const next = state.providers.filter((p) => p.id !== id);
        persistProviders(next);
        return { providers: next };
      });
    }
  },

  addModel: (providerId, model) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === providerId
          ? { ...p, models: [...p.models.filter((m) => m.id !== model.id), model] }
          : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  removeModel: (providerId, modelId) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === providerId
          ? { ...p, models: p.models.filter((m) => m.id !== modelId) }
          : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  setModels: (providerId, models) =>
    set((state) => {
      const next = state.providers.map((p) =>
        p.id === providerId ? { ...p, models } : p
      );
      persistProviders(next);
      return { providers: next };
    }),

  getEnabled: () => get().providers.filter((p) => p.enabled),

  exportProviders: () => JSON.stringify(get().providers, null, 2),

  importProviders: (json) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        set({ providers: parsed as ModelProvider[] });
        persistProviders(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
