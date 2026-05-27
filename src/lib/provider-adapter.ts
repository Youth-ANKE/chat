/**
 * Multi-provider adapter — translates to OpenAI-compatible format.
 * All major providers (DeepSeek, OpenAI, Anthropic via proxy, Ollama, etc.)
 * now speak OpenAI-compatible APIs, so this is mostly transparent.
 */
import type { ModelProvider, ProviderModel } from '../types';
import { DEFAULT_DEEPSEEK_MODEL } from '../types';

/** Detect if running inside Electron */
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;

/** Default built-in providers */
export const BUILTIN_PROVIDERS: ModelProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'deepseek',
    apiKey: '',
    // In Electron: go direct to DeepSeek API (no Vercel proxy). In web: use the proxy.
    baseUrl: isElectron ? 'https://api.deepseek.com' : '/api/chat',
    models: [
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', maxTokens: 8192, supportsThinking: false, supportsVision: false, supportsTools: true, pricing: { inputPerMillion: 1, outputPerMillion: 2 } },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', maxTokens: 8192, supportsThinking: true, supportsVision: false, supportsTools: true, pricing: { inputPerMillion: 4, outputPerMillion: 16 } },
    ],
    enabled: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 16384, supportsThinking: false, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 15, outputPerMillion: 60 } },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 16384, supportsThinking: false, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 0.6, outputPerMillion: 2.4 } },
      { id: 'o3-mini', name: 'o3 Mini', maxTokens: 100000, supportsThinking: true, supportsVision: false, supportsTools: false, pricing: { inputPerMillion: 7.7, outputPerMillion: 30 } },
    ],
    enabled: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', maxTokens: 64000, supportsThinking: true, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 21, outputPerMillion: 105 } },
      { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4', maxTokens: 64000, supportsThinking: false, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 5.6, outputPerMillion: 28 } },
    ],
    enabled: false,
  },
  {
    id: 'google',
    name: 'Google',
    type: 'custom',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', maxTokens: 8192, supportsThinking: false, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 0.7, outputPerMillion: 2.8 } },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 8192, supportsThinking: true, supportsVision: true, supportsTools: true, pricing: { inputPerMillion: 8.7, outputPerMillion: 43 } },
    ],
    enabled: false,
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    type: 'ollama',
    apiKey: '',
    baseUrl: 'http://localhost:11434/v1',
    models: [],
    enabled: false,
  },
  {
    id: 'mimo',
    name: 'MiMo',
    type: 'mimo',
    authType: 'api-key',
    apiKey: '',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    models: [
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', maxTokens: 8192, supportsThinking: true, supportsVision: false, supportsTools: true, pricing: { inputPerMillion: 0, outputPerMillion: 0 } },
    ],
    enabled: false,
  },
];

export function getProviderById(id: string, providers: ModelProvider[]): ModelProvider | undefined {
  return providers.find((p) => p.id === id);
}

export function getModelById(modelId: string, providers: ModelProvider[]): { provider: ModelProvider; model: ProviderModel } | undefined {
  for (const p of providers) {
    const m = p.models.find((m) => m.id === modelId);
    if (m) return { provider: p, model: m };
  }
}

/**
 * Returns the API base URL for a given provider.
 * If the user has set a custom base URL, use that.
 */
export function getApiBaseUrl(providerId: string, providers: ModelProvider[]): string {
  const p = getProviderById(providerId, providers);
  if (!p) return '/api/chat';
  return p.baseUrl ?? '/api/chat';
}

/**
 * Returns the API key for a given provider (used via backend proxy),
 * or falls back to the /api/chat endpoint if no key is set.
 */
export function getApiKey(providerId: string, providers: ModelProvider[]): string | undefined {
  const p = getProviderById(providerId, providers);
  if (!p?.apiKey) return undefined;
  return p.apiKey;
}

/**
 * Returns the auth type for a provider (defaults to 'bearer').
 */
export function getAuthType(providerId: string, providers: ModelProvider[]): 'bearer' | 'api-key' {
  const p = getProviderById(providerId, providers);
  return p?.authType ?? 'bearer';
}

/** Get all enabled providers */
export function getEnabledProviders(providers: ModelProvider[]): ModelProvider[] {
  return providers.filter((p) => p.enabled);
}

/** Get all models across enabled providers */
export function getAllModels(providers: ModelProvider[]): { providerId: string; providerName: string; model: ProviderModel }[] {
  return providers
    .filter((p) => p.enabled)
    .flatMap((p) => p.models.map((m) => ({ providerId: p.id, providerName: p.name, model: m })));
}

/** Build default model and provider for a new session */
export function getDefaultModelAndProvider(providers: ModelProvider[], defaultModel?: string, defaultProviderId?: string): { model: string; providerId: string } {
  const enabled = getEnabledProviders(providers);
  if (enabled.length === 0) return { model: DEFAULT_DEEPSEEK_MODEL, providerId: 'deepseek' };

  const targetProvider = defaultProviderId
    ? enabled.find((p) => p.id === defaultProviderId) ?? enabled[0]
    : enabled[0];

  const modelExists = defaultModel && targetProvider.models.some((m) => m.id === defaultModel);
  const model = modelExists ? defaultModel! : (targetProvider.models[0]?.id ?? DEFAULT_DEEPSEEK_MODEL);

  return { model, providerId: targetProvider.id };
}
