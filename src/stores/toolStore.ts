import { create } from 'zustand';
import type { UserTool, ToolDefinition } from '../types';

const STORAGE_KEY = 'deepseek_user_tools';

function loadTools(): UserTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTools(tools: UserTool[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  } catch { /* ignore */ }
}

function idGen() {
  return `ut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ToolState {
  tools: UserTool[];
  addTool: (tool: Omit<UserTool, 'id' | 'createdAt'>) => void;
  updateTool: (id: string, updates: Partial<UserTool>) => void;
  removeTool: (id: string) => void;
  toggleTool: (id: string) => void;
  getEnabledToolDefinitions: () => ToolDefinition[];
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: loadTools(),

  addTool: (tool) => {
    const newTool: UserTool = {
      ...tool,
      id: idGen(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().tools, newTool];
    set({ tools: updated });
    saveTools(updated);
  },

  updateTool: (id, updates) => {
    const updated = get().tools.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ tools: updated });
    saveTools(updated);
  },

  removeTool: (id) => {
    const updated = get().tools.filter((t) => t.id !== id);
    set({ tools: updated });
    saveTools(updated);
  },

  toggleTool: (id) => {
    const updated = get().tools.map((t) =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    );
    set({ tools: updated });
    saveTools(updated);
  },

  getEnabledToolDefinitions: () => {
    const tools = get().tools.filter((t) => t.enabled);
    return tools.map((t) => {
      let schema: Record<string, unknown>;
      try {
        schema = JSON.parse(t.parameterSchema);
      } catch {
        schema = { type: 'object', properties: {}, required: [] };
      }
      return {
        name: t.name,
        description: t.description,
        parameters: schema as ToolDefinition['parameters'],
      };
    });
  },
}));
