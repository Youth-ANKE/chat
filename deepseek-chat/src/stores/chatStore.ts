import { create } from 'zustand';
import type { ChatSession, ChatMessage, ModelName } from '../types';
import { createSession } from '../lib/session';
import { loadSessions, saveSession, deleteSession as delSession } from '../lib/storage';

interface ChatState {
  sessions: ChatSession[];
  activeId: string | null;

  // Actions
  init: () => Promise<void>;
  newSession: (model?: ModelName) => ChatSession;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  setSystemPrompt: (id: string, prompt: string) => void;
  setModel: (id: string, model: ModelName) => void;
  setThinking: (id: string, thinking: boolean) => void;
  setTemperature: (id: string, temperature: number) => void;
  pinSession: (id: string) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;

  // Message actions
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  updateMessage: (
    sessionId: string,
    msgId: string,
    updates: Partial<ChatMessage>
  ) => void;
  appendContent: (sessionId: string, msgId: string, chunk: string) => void;
  appendReasoning: (sessionId: string, msgId: string, chunk: string) => void;
  clearMessages: (sessionId: string) => void;

  // Helpers
  getActive: () => ChatSession | undefined;
  getActiveMessages: () => ChatMessage[];
  exportConversation: (sessionId: string) => string;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeId: null,

  init: async () => {
    const sessions = await loadSessions();
    if (sessions.length === 0) {
      const s = createSession('deepseek-v4-flash');
      set({ sessions: [s], activeId: s.id });
      await saveSession(s);
    } else {
      set({ sessions, activeId: sessions[0].id });
    }
  },

  newSession: (model) => {
    const s = createSession(model ?? 'deepseek-v4-flash');
    set((state) => ({
      sessions: [s, ...state.sessions],
      activeId: s.id,
    }));
    saveSession(s);
    return s;
  },

  switchSession: (id) => set({ activeId: id }),

  deleteSession: (id) => {
    const { sessions, activeId } = get();
    const filtered = sessions.filter((s) => s.id !== id);
    let nextActive = activeId;
    if (activeId === id) {
      nextActive = filtered.length > 0 ? filtered[0].id : null;
    }
    set({ sessions: filtered, activeId: nextActive });
    delSession(id);
    if (!nextActive) {
      const s = createSession('deepseek-v4-flash');
      set((state) => ({
        sessions: [...state.sessions, s],
        activeId: s.id,
      }));
      saveSession(s);
    }
  },

  renameSession: (id, title) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  setSystemPrompt: (id, prompt) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, systemPrompt: prompt } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  setModel: (id, model) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, model } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  setThinking: (id, thinking) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, thinking } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  setTemperature: (id, temperature) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, temperature } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  pinSession: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, pinned: !s.pinned, updatedAt: new Date().toISOString() } : s
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) saveSession(session);
  },

  setMessages: (sessionId, messages) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const updated = { ...s, messages, updatedAt: new Date().toISOString() };
        saveSession(updated);
        return updated;
      }),
    }));
  },

  addMessage: (sessionId, msg) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const updated = { ...s, messages: [...s.messages, msg], updatedAt: new Date().toISOString() };
        saveSession(updated);
        return updated;
      }),
    }));
  },

  updateMessage: (sessionId, msgId, updates) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const updated = {
          ...s,
          messages: s.messages.map((m) =>
            m.id === msgId ? { ...m, ...updates } : m
          ),
        };
        saveSession(updated);
        return updated;
      }),
    }));
  },

  appendContent: (sessionId, msgId, chunk) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id === msgId ? { ...m, content: m.content + chunk } : m
          ),
        };
      }),
    }));
  },

  appendReasoning: (sessionId, msgId, chunk) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id === msgId
              ? { ...m, reasoning: (m.reasoning ?? '') + chunk }
              : m
          ),
        };
      }),
    }));
  },

  clearMessages: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const updated = { ...s, messages: [] };
        saveSession(updated);
        return updated;
      }),
    }));
  },

  getActive: () => {
    const { sessions, activeId } = get();
    return sessions.find((s) => s.id === activeId);
  },

  getActiveMessages: () => {
    const session = get().getActive();
    return session?.messages ?? [];
  },

  exportConversation: (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return '';
    const lines: string[] = [];
    lines.push(`# ${session.title}`);
    lines.push('');
    lines.push(`> 模型: ${session.model} | Temperature: ${session.temperature} | 深度思考: ${session.thinking ? '是' : '否'}`);
    lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of session.messages) {
      if (msg.role === 'system') continue;
      if (msg.role === 'user') {
        lines.push(`### 🧑 你`);
      } else if (msg.status === 'error') {
        lines.push(`### ❌ 错误`);
      } else {
        lines.push(`### 🤖 DeepSeek`);
      }
      lines.push('');
      lines.push(msg.content || '（空消息）');
      lines.push('');
    }
    return lines.join('\n');
  },
}));
