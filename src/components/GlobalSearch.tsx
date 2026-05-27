import { useState, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Search, X, MessageSquare, ArrowRight, Cpu } from 'lucide-react';
import { playClick } from '../lib/sound';

interface GlobalSearchProps {
  onClose: () => void;
  onNavigate: (sessionId: string) => void;
}

export function GlobalSearch({ onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const searchAllMessages = useChatStore((s) => s.searchAllMessages);
  const sessions = useChatStore((s) => s.sessions);

  const results = query.trim() ? searchAllMessages(query) : [];

  const handleNavigate = useCallback(
    (sessionId: string) => {
      playClick();
      onNavigate(sessionId);
      onClose();
    },
    [onNavigate, onClose]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode
            ? 'bg-[#0a0f1a] border-white/[0.08]'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className={`w-4 h-4 ${darkMode ? 'text-cyan-400/60' : 'text-indigo-400'}`} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索所有对话中的消息…"
            className={`flex-1 bg-transparent text-sm outline-none ${
              darkMode ? 'text-white/85 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
          {!query.trim() ? (
            <div className={`px-4 py-10 text-center text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              输入关键词搜索所有对话内容
            </div>
          ) : results.length === 0 ? (
            <div className={`px-4 py-10 text-center text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              未找到匹配的消息
            </div>
          ) : (
            <div className="py-2">
              {results.map(({ sessionId, sessionTitle, message }) => (
                <button
                  key={message.id}
                  onClick={() => handleNavigate(sessionId)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    darkMode
                      ? 'hover:bg-white/[0.04]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className={`w-3 h-3 ${darkMode ? 'text-cyan-400/50' : 'text-indigo-400'}`} />
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-cyan-400/70' : 'text-indigo-500'}`}>
                      {sessionTitle}
                    </span>
                    {message.role === 'user' ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        darkMode ? 'bg-purple-500/10 text-purple-400/70' : 'bg-purple-100 text-purple-600'
                      }`}>你</span>
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        darkMode ? 'bg-cyan-500/10 text-cyan-400/70' : 'bg-cyan-100 text-cyan-600'
                      }`}>
                        <Cpu className="w-2.5 h-2.5" />AI
                      </span>
                    )}
                    <div className="flex-1" />
                    <ArrowRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 ${
                      darkMode ? 'text-cyan-400' : 'text-indigo-400'
                    }`} />
                  </div>
                  <p className={`text-xs line-clamp-2 ${
                    darkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    {highlightMatch(
                      (message.content || message.reasoning || '').slice(0, 200),
                      query
                    )}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-2 border-t text-[10px] ${
          darkMode ? 'border-white/[0.06] text-gray-600' : 'border-gray-200 text-gray-400'
        }`}>
          {results.length > 0 ? `${results.length} 条匹配` : '按 Esc 关闭'}
        </div>
      </div>
    </div>
  );
}

/** Naively wrap matching text in a highlight span */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
