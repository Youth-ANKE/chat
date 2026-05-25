export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'streaming' | 'done' | 'error';
  error?: string;
  reasoning?: string;
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
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  darkMode: boolean;
  defaultModel: ModelName;
  defaultTemperature: number;
  defaultThinking: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  defaultModel: 'deepseek-v4-flash',
  defaultTemperature: 0.7,
  defaultThinking: true,
};

export const MODEL_OPTIONS: { value: ModelName; label: string; desc: string }[] = [
  { value: 'deepseek-v4-flash', label: 'V4 Flash', desc: '快速、低成本' },
  { value: 'deepseek-v4-pro', label: 'V4 Pro', desc: '高质量、深度推理' },
];
