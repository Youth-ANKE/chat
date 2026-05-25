import { nanoid } from 'nanoid';
import type { ChatMessage, ChatSession, ModelName } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

export function createMessage(
  role: ChatMessage['role'],
  content: string,
  status?: ChatMessage['status']
): ChatMessage {
  return {
    id: nanoid(),
    role,
    content,
    createdAt: new Date().toISOString(),
    status: status ?? (role === 'assistant' ? 'streaming' : 'done'),
  };
}

export function createSession(model?: ModelName): ChatSession {
  const settings = useSettingsStore.getState().settings;
  return {
    id: nanoid(),
    title: '新对话',
    messages: [],
    model: model ?? settings.defaultModel,
    thinking: settings.defaultThinking,
    temperature: settings.defaultTemperature,
    topP: settings.topP,
    maxTokens: settings.maxTokens,
    webSearch: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function generateTitle(content: string): string {
  const cleaned = content.replace(/[#*`~>\-\[\]()]+/g, '').trim();
  return cleaned.slice(0, 30) || '新对话';
}
