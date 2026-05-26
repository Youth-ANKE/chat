import { X, Bot, Search, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import type { ConversationTemplate } from '../types';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: ConversationTemplate) => void;
  darkMode: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  dev: '开发',
  writing: '写作',
  education: '教育',
  business: '商业',
  creative: '创意',
  general: '通用',
};

export function TemplateSelector({ open, onClose, onSelect, darkMode }: TemplateSelectorProps) {
  const { templates } = useTemplateStore();
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = search.trim()
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      )
    : templates;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 glass-heavy rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white/90">选择对话模板</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'
          }`}>
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索模板..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-300 placeholder-gray-600"
              autoFocus
            />
          </div>
        </div>

        {/* Template grid */}
        <div className="p-4 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => { onSelect(tpl); onClose(); }}
              className={`flex flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-all border ${
                darkMode
                  ? 'bg-white/[0.02] border-white/[0.04] hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]'
                  : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg flex-shrink-0">{tpl.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium block truncate text-gray-200">{tpl.name}</span>
                  <span className="text-[10px] text-gray-500 block truncate">{tpl.description}</span>
                </div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ml-7 ${
                darkMode ? 'bg-white/[0.03] text-gray-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {CATEGORY_LABELS[tpl.category] ?? tpl.category}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-8 text-center text-sm text-gray-500">
              未找到匹配的模板
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 border-t border-white/5">
          <p className="text-[10px] text-gray-600">
            模板会预设 System Prompt，帮助 AI 更好地理解你的需求
          </p>
        </div>
      </div>
    </div>
  );
}
