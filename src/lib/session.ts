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
 * Build headers for the AI title request based on auth type.
 */
function buildTitleHeaders(apiKey: string, authType: 'bearer' | 'api-key'): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authType === 'api-key') {
    headers['api-key'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Generate a concise title for a conversation using the current provider's API.
 * Falls back to the simple `generateTitle` on failure.
 */
export async function generateAITitle(
  content: string,
  model: string,
  apiBase: string,
  apiKey: string,
  authType: 'bearer' | 'api-key'
): Promise<string> {
  try {
    // Defensive: skip if apiBase looks malformed (e.g. "[object Object]" from stale state)
    if (typeof apiBase !== 'string' || (!apiBase.startsWith('http') && !apiBase.startsWith('/'))) {
      return generateTitle(content);
    }

    // Can't call direct API without a key — skip early
    if (!apiKey && apiBase !== '/api/chat') {
      return generateTitle(content);
    }

    const cleaned = content.replace(/[#*`~>\-\[\]()]+/g, '').trim();
    const prompt = cleaned.slice(0, 200);

    // If using deepseek proxy without a direct key, use /api/chat
    const url = (!apiKey && apiBase === '/api/chat')
      ? '/api/chat'
      : `${apiBase}/chat/completions`;

    const headers = buildTitleHeaders(apiKey, authType);

    const resp = await fetch(url, {
      method: 'POST',
      headers,
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
