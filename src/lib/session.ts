import { nanoid } from 'nanoid';
import type { ChatMessage, ChatSession, ModelName, Settings } from '../types';
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

export function createSession(model?: ModelName, providerId?: string): ChatSession {
  const settings = useSettingsStore.getState().settings;
  return {
    id: nanoid(),
    title: '新对话',
    messages: [],
    model: model ?? settings.defaultModel,
    providerId: providerId ?? settings.defaultProviderId,
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

/**
 * Generate a concise title for a conversation using the DeepSeek API.
 * Falls back to the simple `generateTitle` on failure.
 */
export async function generateAITitle(
  content: string,
  model: string,
  settings: Settings
): Promise<string> {
  try {
    const cleaned = content.replace(/[#*`~>\-\[\]()]+/g, '').trim();
    const prompt = cleaned.slice(0, 200);

    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是一个标题生成器。用户给你一条消息，你返回一个10字以内的简洁标题（不超过20个字符），只用返回标题文本，不要任何前缀、引号或解释。',
          },
          {
            role: 'user',
            content: `请为这条消息生成一个简短的标题：${prompt}`,
          },
        ],
        model,
        max_tokens: 32,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    const title = data.choices?.[0]?.message?.content?.trim();
    if (title && title.length > 0) {
      // Clean up the title (remove quotes, etc.)
      return title.replace(/^["「『]|["」』]$/g, '').replace(/\n/g, ' ').slice(0, 30);
    }
    throw new Error('Empty response');
  } catch {
    // Fallback on failure
    return generateTitle(content);
  }
}
