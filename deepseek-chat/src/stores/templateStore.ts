import { create } from 'zustand';
import type { ConversationTemplate } from '../types';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'deepseek_templates_v1';

const BUILTIN_TEMPLATES: ConversationTemplate[] = [
  {
    id: 'code-review',
    name: '代码审查',
    icon: '🔍',
    description: '审查代码逻辑、安全性和性能',
    systemPrompt: '你是一位资深代码审查专家。请审查用户的代码，关注：1) 逻辑错误 2) 安全漏洞 3) 性能问题 4) 最佳实践。请给出具体改进建议和示例代码。',
    category: 'dev',
  },
  {
    id: 'translator',
    name: '翻译助手',
    icon: '🌐',
    description: '专业中英翻译，保留原文格式',
    systemPrompt: '你是一位专业翻译。请将用户输入准确翻译，保持原文格式和语气。如果原文包含代码块或Markdown，请保留格式。先输出翻译结果，再附上关键术语对照表。',
    category: 'general',
  },
  {
    id: 'essay-writer',
    name: '文章写作',
    icon: '✍️',
    description: '辅助撰写文章、报告、文案',
    systemPrompt: '你是一位专业作家。请帮助用户撰写高质量的文章。注意：1) 结构清晰 2) 论点有力 3) 语言流畅 4) 符合目标读者。根据用户需求调整文风和篇幅。',
    category: 'writing',
  },
  {
    id: 'tutor',
    name: '学习导师',
    icon: '🎓',
    description: '用苏格拉底式教学法解释概念',
    systemPrompt: '你是一位耐心的导师，使用苏格拉底式教学法。不要直接给出答案，而是通过提问引导用户思考。将复杂概念分解为简单部分，逐步推进。当用户表现出困惑时，提供适当提示。',
    category: 'education',
  },
  {
    id: 'business-analyst',
    name: '商业分析',
    icon: '📊',
    description: '分析商业问题，提供战略建议',
    systemPrompt: '你是一位资深商业顾问。请对用户的商业问题进行系统性分析，使用SWOT等方法。提供可操作的策略建议，并评估各方案的优劣和风险。',
    category: 'business',
  },
  {
    id: 'brainstorm',
    name: '头脑风暴',
    icon: '💡',
    description: '创意发散，列举多种可能性',
    systemPrompt: '你是一位创意顾问。请帮助用户进行头脑风暴，尽可能多地生成想法和可能性。不要过早评判，鼓励发散思维。可以按类别组织想法，并标注每个想法的创新程度和可行性。',
    category: 'creative',
  },
];

function loadTemplates(): ConversationTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...BUILTIN_TEMPLATES];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...BUILTIN_TEMPLATES];
  } catch {
    return [...BUILTIN_TEMPLATES];
  }
}

function persist(templates: ConversationTemplate[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)); } catch { /* ignore */ }
}

interface TemplateState {
  templates: ConversationTemplate[];
  addTemplate: (tpl: Omit<ConversationTemplate, 'id'>) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<ConversationTemplate>) => void;
  resetToDefaults: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadTemplates(),

  addTemplate: (tpl) =>
    set((state) => {
      const next = [...state.templates, { ...tpl, id: nanoid() }];
      persist(next);
      return { templates: next };
    }),

  removeTemplate: (id) =>
    set((state) => {
      const next = state.templates.filter((t) => t.id !== id);
      persist(next);
      return { templates: next };
    }),

  updateTemplate: (id, updates) =>
    set((state) => {
      const next = state.templates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      persist(next);
      return { templates: next };
    }),

  resetToDefaults: () => {
    set({ templates: [...BUILTIN_TEMPLATES] });
    persist([...BUILTIN_TEMPLATES]);
  },
}));
