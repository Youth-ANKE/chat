import { nanoid } from 'nanoid';
import type { ChatMessage, ChatSession } from '../types';

interface ChatGPTMessage {
  author: { role: string; name?: string };
  content: { content_type: string; parts: string[] };
  create_time: number;
}

interface ChatGPTConversation {
  title: string;
  create_time: number;
  mapping: Record<string, {
    message: ChatGPTMessage | null;
    parent: string | null;
    children: string[];
  }>;
  current_node: string | null;
}

function parseMarkdownConversation(text: string): { title: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
  const lines = text.split('\n');
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];
  let title = '';

  for (const line of lines) {
    const userMatch = line.match(/^##\s*(?:👤|User|用户)/i);
    const assistantMatch = line.match(/^##\s*(?:🤖|AI|Assistant|助手)/i);
    const titleMatch = line.match(/^#\s*(.+)/);

    if (titleMatch && !title) {
      title = titleMatch[1].trim();
      continue;
    }

    if (userMatch || assistantMatch) {
      if (currentRole && currentContent.length > 0) {
        messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
      }
      currentRole = userMatch ? 'user' : 'assistant';
      currentContent = [];
      continue;
    }

    if (currentRole && line.trim()) {
      currentContent.push(line);
    }
  }

  if (currentRole && currentContent.length > 0) {
    messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
  }

  return { title: title || 'Imported Conversation', messages };
}

/** Import from ChatGPT data export format */
export async function importChatGPTExport(file: File): Promise<Omit<ChatSession, 'model' | 'thinking' | 'temperature' | 'topP' | 'maxTokens' | 'webSearch'>[]> {
  const text = await file.text();
  const data: ChatGPTConversation[] = JSON.parse(text);

  return data.map((conv) => {
    const messages: ChatMessage[] = [];
    const visited = new Set<string>();

    // Walk the conversation tree following current_node -> parent chain
    let nodeId = conv.current_node;
    const nodeOrder: string[] = [];
    while (nodeId && !visited.has(nodeId)) {
      visited.add(nodeId);
      const node = conv.mapping[nodeId];
      if (!node) break;
      nodeOrder.unshift(nodeId);
      nodeId = node.parent;
    }

    for (const id of nodeOrder) {
      const node = conv.mapping[id];
      if (!node?.message) continue;
      const msg = node.message;
      const role = msg.author.role === 'assistant' ? 'assistant' as const :
                   msg.author.role === 'system' ? 'system' as const :
                   'user' as const;
      const content = msg.content.parts.join('\n\n');
      if (!content.trim()) continue;

      messages.push({
        id: nanoid(),
        role,
        content,
        createdAt: new Date(msg.create_time * 1000).toISOString(),
        status: 'done',
      });
    }

    return {
      id: nanoid(),
      title: conv.title || 'Imported Chat',
      messages,
      pinned: false,
      createdAt: new Date(conv.create_time * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

/** Import from Markdown conversation export */
export function importMarkdownConversation(text: string): Omit<ChatSession, 'model' | 'thinking' | 'temperature' | 'topP' | 'maxTokens' | 'webSearch'> {
  const { title, messages: rawMessages } = parseMarkdownConversation(text);
  const messages = rawMessages.map((m) => ({
    id: nanoid(),
    role: m.role,
    content: m.content,
    createdAt: new Date().toISOString(),
    status: 'done' as const,
  }));

  return {
    id: nanoid(),
    title,
    messages,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Build a shareable compressed link from conversation data */
export function buildShareLink(session: ChatSession): string {
  const data = JSON.stringify({
    title: session.title,
    model: session.model,
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      reasoning: m.reasoning,
    })),
  });

  // Use LZ-based compression via encodeURIComponent
  const compressed = btoa(encodeURIComponent(data));
  return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
}

/** Parse shared conversation from URL */
export function parseShareLink(hash: string): Omit<ChatSession, 'model' | 'thinking' | 'temperature' | 'topP' | 'maxTokens' | 'webSearch'> | null {
  try {
    const data = JSON.parse(decodeURIComponent(atob(hash)));
    return {
      id: nanoid(),
      title: data.title || 'Shared Chat',
      messages: (data.messages || []).map((m: { role: string; content: string; reasoning?: string }) => ({
        id: nanoid(),
        role: m.role as 'user' | 'assistant',
        content: m.content,
        reasoning: m.reasoning,
        createdAt: new Date().toISOString(),
        status: 'done' as const,
      })),
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
