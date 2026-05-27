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
  /** Auto-generated title flag (for the message that triggered title generation) */
  titleGenerated?: boolean;
  /** ID of the message being replied to */
  replyTo?: string;
}

export type ModelName = string;

/** Centralised default model — change here to update all references */
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash';

export interface ChatSession {
  id: string;
  title: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  model: ModelName;
  /** Provider ID this session uses (falls back to default) */
  providerId?: string;
  thinking: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  webSearch: boolean;
  pinned?: boolean;
  /** 消息收藏 ID 列表 */
  bookmarks?: string[];
  /** 对话标签 */
  tags?: string[];
  /** 所属文件夹 */
  folder?: string;
  /** 分叉来源会话 ID */
  parentSessionId?: string;
  /** 分叉节点的消息索引 */
  branchPoint?: number;
  /** 是否已归档 */
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccentColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
export type Language = 'zh' | 'en';

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
  /** Default provider ID */
  defaultProviderId?: string;
  defaultTemperature: number;
  defaultThinking: boolean;
  /** 上下文消息数量上限（0=不限制） */
  contextLimit: number;
  topP: number;
  maxTokens: number;
  streamOutput: boolean;
  /** 主题强调色 */
  accentColor: AccentColor;
  /** 消息字体大小 */
  fontSize: 'sm' | 'base' | 'lg';
  /** 是否显示消息时间 */
  showTimestamps: boolean;
  /** Desktop notifications when response completes */
  notificationsEnabled: boolean;
  /** Auto-generate conversation titles using AI */
  autoTitleAI: boolean;
  /** Whether to show the context window usage bar */
  showContextBar: boolean;
  /** UI language */
  language: Language;
  /** Custom keyboard shortcuts */
  customShortcuts?: Record<string, string>;
  /** Whether voice input auto-sends */
  voiceAutoSend: boolean;
  /** Whether to show archived sessions in sidebar */
  showArchived: boolean;
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

/** Pricing — dynamic based on provider models */
export const DEFAULT_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number; label: string }> = {
  'deepseek-v4-flash':   { inputPerMillion: 1,  outputPerMillion: 2,  label: 'DeepSeek V4 Flash' },
  'deepseek-v4-pro':     { inputPerMillion: 4,  outputPerMillion: 16, label: 'DeepSeek V4 Pro' },
  'gpt-4o':              { inputPerMillion: 15, outputPerMillion: 60, label: 'GPT-4o' },
  'gpt-4o-mini':         { inputPerMillion: 0.6, outputPerMillion: 2.4, label: 'GPT-4o Mini' },
  'claude-sonnet-4-20250514': { inputPerMillion: 21, outputPerMillion: 105, label: 'Claude Sonnet 4' },
  'claude-haiku-4-20250514':  { inputPerMillion: 5.6, outputPerMillion: 28, label: 'Claude Haiku 4' },
  'gemini-2.5-flash':    { inputPerMillion: 0.7, outputPerMillion: 2.8, label: 'Gemini Flash' },
};

/** Calculate cost in RMB from token counts (dynamic pricing lookup) */
export function calculateCost(model: ModelName, inputTokens: number, outputTokens: number, pricingMap?: Record<string, { inputPerMillion: number; outputPerMillion: number }>): number {
  const map = pricingMap ?? {};
  const price = map[model] ?? DEFAULT_PRICING[model] ?? { inputPerMillion: 1, outputPerMillion: 2 };
  const inputCost = (inputTokens / 1_000_000) * price.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * price.outputPerMillion;
  return Math.round((inputCost + outputCost) * 10000) / 10000;
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
  defaultModel: DEFAULT_DEEPSEEK_MODEL,
  defaultProviderId: 'deepseek',
  defaultTemperature: 0.7,
  defaultThinking: true,
  contextLimit: 0,
  topP: 1.0,
  maxTokens: 4096,
  streamOutput: true,
  accentColor: 'cyan',
  fontSize: 'base',
  showTimestamps: true,
  notificationsEnabled: true,
  autoTitleAI: true,
  showContextBar: true,
  language: 'zh',
  voiceAutoSend: false,
  showArchived: false,
};

export const ACCENT_COLORS: { value: AccentColor; label: string; class: string; glow: string }[] = [
  { value: 'cyan', label: '科技蓝', class: 'bg-cyan-500', glow: 'rgba(0,229,255,0.4)' },
  { value: 'purple', label: '星云紫', class: 'bg-purple-500', glow: 'rgba(179,102,255,0.4)' },
  { value: 'emerald', label: '翡翠绿', class: 'bg-emerald-500', glow: 'rgba(0,255,136,0.4)' },
  { value: 'amber', label: '日落金', class: 'bg-amber-500', glow: 'rgba(251,191,36,0.4)' },
  { value: 'rose', label: '玫瑰红', class: 'bg-rose-500', glow: 'rgba(244,63,94,0.4)' },
  { value: 'blue', label: '深海蓝', class: 'bg-blue-500', glow: 'rgba(68,136,255,0.4)' },
];

export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
];

// ── Knowledge Base ──
export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md';
  chunks: KnowledgeChunk[];
  createdAt: string;
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  embedding?: number[];
}

// ── Tool Calling ──
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface UserTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** JSON Schema for parameters */
  parameterSchema: string;
  /** JavaScript function body (runs in sandbox) */
  handlerCode: string;
  createdAt: string;
}

// ── Model Provider ──
export interface ModelProvider {
  id: string;
  name: string;
  type: 'deepseek' | 'openai' | 'anthropic' | 'ollama' | 'mimo' | 'custom';
  apiKey: string;
  baseUrl?: string;
  /** Authentication header style. 'bearer' → Authorization: Bearer <key>; 'api-key' → api-key: <key>. Defaults to 'bearer'. */
  authType?: 'bearer' | 'api-key';
  models: ProviderModel[];
  enabled: boolean;
}

export interface ProviderModel {
  id: string;
  name: string;
  maxTokens: number;
  supportsThinking: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  pricing?: { inputPerMillion: number; outputPerMillion: number };
}

// ── Conversation Templates ──
export interface ConversationTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  category: 'dev' | 'writing' | 'education' | 'business' | 'creative' | 'general';
}

// ── Comparison Mode ──
export interface ComparisonSession {
  id: string;
  leftProviderId: string;
  leftModel: string;
  rightProviderId: string;
  rightModel: string;
  prompt: string;
  leftContent: string;
  rightContent: string;
  leftReasoning?: string;
  rightReasoning?: string;
  leftStatus: 'idle' | 'streaming' | 'done' | 'error';
  rightStatus: 'idle' | 'streaming' | 'done' | 'error';
}

// ── Shortcuts Configuration ──
export interface ShortcutBinding {
  id: string;
  label: string;
  defaultKeys: string;
  currentKeys: string;
}

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: 'newSession', label: '新建对话', defaultKeys: 'Ctrl+N', currentKeys: 'Ctrl+N' },
  { id: 'toggleSidebar', label: '切换侧栏', defaultKeys: 'Ctrl+B', currentKeys: 'Ctrl+B' },
  { id: 'focusInput', label: '聚焦输入框', defaultKeys: 'Ctrl+E', currentKeys: 'Ctrl+E' },
  { id: 'exportChat', label: '导出对话', defaultKeys: 'Ctrl+Shift+E', currentKeys: 'Ctrl+Shift+E' },
  { id: 'clearChat', label: '清空对话', defaultKeys: 'Ctrl+K', currentKeys: 'Ctrl+K' },
  { id: 'searchMessages', label: '搜索消息', defaultKeys: 'Ctrl+F', currentKeys: 'Ctrl+F' },
  { id: 'globalSearch', label: '全局搜索', defaultKeys: 'Ctrl+Shift+F', currentKeys: 'Ctrl+Shift+F' },
  { id: 'promptLibrary', label: '提示词库', defaultKeys: 'Ctrl+P', currentKeys: 'Ctrl+P' },
  { id: 'shortcutHelp', label: '帮助面板', defaultKeys: 'Ctrl+/', currentKeys: 'Ctrl+/' },
  { id: 'settings', label: '设置面板', defaultKeys: 'Ctrl+,', currentKeys: 'Ctrl+,' },
];
