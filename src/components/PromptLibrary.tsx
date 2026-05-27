import { useState } from 'react';
import { Search, X, BookOpen, ArrowUpRight } from 'lucide-react';
import { PROMPT_CATEGORIES, filterPrompts, type PromptTemplate } from '../lib/prompts';
import { cn } from '../lib/utils';
import { playClick } from '../lib/sound';

interface PromptLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (promptText: string) => void;
  darkMode?: boolean;
}

export function PromptLibrary({ open, onClose, onSelect, darkMode = true }: PromptLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const d = darkMode;

  const prompts = filterPrompts(category).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const handleSelect = (prompt: PromptTemplate) => {
    playClick();
    onSelect(prompt.prompt);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[8000] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 backdrop-blur-sm',
          d ? 'bg-black/50' : 'bg-black/30'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-in max-h-[70vh] flex flex-col overflow-hidden',
          d
            ? 'glass-heavy border border-white/[0.08]'
            : 'bg-white border border-gray-200/70'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-5 py-4 flex-shrink-0 border-b',
            d ? 'border-white/[0.06]' : 'border-gray-100'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center',
              d ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-indigo-50 border border-indigo-100'
            )}>
              <BookOpen className={cn('w-4 h-4', d ? 'text-cyan-400' : 'text-indigo-500')} />
            </div>
            <div>
              <h3 className={cn('text-sm font-semibold', d ? 'text-white/90' : 'text-gray-800')}>
                提示词库
              </h3>
              <p className={cn('text-[11px]', d ? 'text-gray-500' : 'text-gray-400')}>
                预设提示词模板，一键使用
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              d ? 'text-gray-500 hover:bg-white/10 hover:text-gray-300' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className={cn('px-5 py-3 flex-shrink-0 border-b', d ? 'border-white/[0.04]' : 'border-gray-100')}>
          <div className="relative">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5', d ? 'text-gray-500' : 'text-gray-400')} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索提示词..."
              className={cn(
                'w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all',
                d
                  ? 'bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 text-white/80 placeholder-gray-600'
                  : 'bg-gray-50 border border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 text-gray-700 placeholder-gray-400'
              )}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className={cn(
          'flex flex-wrap items-center gap-1.5 px-5 py-2.5 flex-shrink-0 border-b',
          d ? 'border-white/[0.04]' : 'border-gray-100'
        )}>
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
                category === cat.key
                  ? d
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : d
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{cat.icon}</span>
              {cat.key}
            </button>
          ))}
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {prompts.length === 0 ? (
            <div className={cn('flex flex-col items-center justify-center py-12 gap-2', d ? 'text-gray-500' : 'text-gray-400')}>
              <BookOpen className="w-8 h-8 opacity-20" />
              <span className="text-sm">{search.trim() ? '未找到匹配的提示词' : '暂无提示词'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelect(prompt)}
                  className={cn(
                    'group flex flex-col items-start gap-2 p-3.5 rounded-xl text-left transition-all duration-200 border',
                    d
                      ? 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.04] hover:border-cyan-500/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.04)]'
                      : 'bg-gray-50/60 hover:bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                  )}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="text-lg flex-shrink-0">{prompt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        'text-sm font-medium transition-colors truncate',
                        d ? 'text-white/85 group-hover:text-cyan-400' : 'text-gray-800 group-hover:text-indigo-600'
                      )}>
                        {prompt.title}
                      </h4>
                      <p className={cn('text-[11px] mt-0.5 line-clamp-2 leading-relaxed', d ? 'text-gray-500' : 'text-gray-500')}>
                        {prompt.description}
                      </p>
                    </div>
                    <ArrowUpRight
                      className={cn(
                        'w-3.5 h-3.5 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0',
                        d ? 'text-gray-600 group-hover:text-cyan-400' : 'text-gray-300 group-hover:text-indigo-500'
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
