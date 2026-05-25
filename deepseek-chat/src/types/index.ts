export interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'text';
  mimeType: string;
  /** Base64 data URI for images, raw text for text files */
  data: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'streaming' | 'done' | 'error';
  error?: string;
  reasoning?: string;
  /** Files attached by the user (shown as previews, sent as multimodal content) */
  attachments?: AttachedFile[];
}

export type ModelName = 'deepseek-v4-flash' | 'deepseek-v4-pro';

export interface ChatSession {
  id: string;
  title: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  model: ModelName;
  thinking: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  webSearch: boolean;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  darkMode: boolean;
  soundEnabled: boolean;
  speechEnabled: boolean;
  speechVoice?: string;
  favoriteVoices: string[];
  musicEnabled: boolean;
  musicMode: 'random' | 'sequential' | '5min' | '10min';
  musicVolume: number;
  defaultModel: ModelName;
  defaultTemperature: number;
  defaultThinking: boolean;
  /** 上下文消息数量上限（0=不限制） */
  contextLimit: number;
  topP: number;
  maxTokens: number;
  streamOutput: boolean;
}

// ── Usage / Cost Tracking ──

export interface APITokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  /** Cache hit tokens (cheaper) */
  prompt_cache_hit_tokens?: number;
  /** Cache miss tokens (standard price) */
  prompt_cache_miss_tokens?: number;
}

export interface UsageRecord {
  id: string;
  sessionId: string;
  sessionTitle: string;
  model: ModelName;
  timestamp: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costRMB: number;
}

/** Pricing — conservative (cache-miss) defaults */
export const MODEL_PRICING: Record<ModelName, { inputPerMillion: number; outputPerMillion: number; label: string }> = {
  'deepseek-v4-flash': { inputPerMillion: 1, outputPerMillion: 2, label: 'V4 Flash' },
  'deepseek-v4-pro':   { inputPerMillion: 3, outputPerMillion: 6, label: 'V4 Pro' },
};

/** Calculate cost in RMB from token counts */
export function calculateCost(model: ModelName, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * price.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * price.outputPerMillion;
  return Math.round((inputCost + outputCost) * 10000) / 10000; // 4 decimal places
}

export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  soundEnabled: true,
  speechEnabled: false,
  speechVoice: undefined,
  favoriteVoices: [],
  musicEnabled: false,
  musicMode: 'sequential',
  musicVolume: 27,
  defaultModel: 'deepseek-v4-flash',
  defaultTemperature: 0.7,
  defaultThinking: true,
  contextLimit: 0,     // 不限制
  topP: 1.0,
  maxTokens: 4096,
  streamOutput: true,
};

export const MODEL_OPTIONS: { value: ModelName; label: string; desc: string }[] = [
  { value: 'deepseek-v4-flash', label: 'V4 Flash', desc: '快速、低成本' },
  { value: 'deepseek-v4-pro', label: 'V4 Pro', desc: '高质量、深度推理' },
];
