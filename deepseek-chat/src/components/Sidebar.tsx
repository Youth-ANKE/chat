import {
  Plus,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Search,
  Sparkles,
  Pin,
  PinOff,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { cn } from '../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function groupByDate(sessions: { id: string; title: string; updatedAt: string; pinned?: boolean }[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: typeof sessions }[] = [];
  const pinnedItems: typeof sessions = [];
  const todayItems: typeof sessions = [];
  const yesterdayItems: typeof sessions = [];
  const olderItems: typeof sessions = [];

  for (const s of sessions) {
    if (s.pinned) { pinnedItems.push(s); continue; }
    const d = new Date(s.updatedAt);
    if (d.toDateString() === today.toDateString()) todayItems.push(s);
    else if (d.toDateString() === yesterday.toDateString()) yesterdayItems.push(s);
    else olderItems.push(s);
  }

  if (pinnedItems.length) groups.push({ label: '📌 置顶', items: pinnedItems });
  if (todayItems.length) groups.push({ label: '今天', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
  if (olderItems.length) groups.push({ label: '更早', items: olderItems });

  return groups;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [search, setSearch] = useState('');
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeId);
  const newSession = useChatStore((s) => s.newSession);
  const switchSession = useChatStore((s) => s.switchSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const pinSession = useChatStore((s) => s.pinSession);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Collapsed sidebar (icon strip) ──
  if (collapsed) {
    return (
      <div className={`flex flex-col items-center gap-3 py-4 border-r w-12 h-full ${
        darkMode
          ? 'glass border-white/5'
          : 'bg-gray-50/80 border-gray-200'
      }`}>
        {/* Logo dot */}
        <div className={`w-2.5 h-2.5 rounded-full mb-1 ${darkMode
          ? 'bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(0,229,255,0.5)]'
          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
        }`} />
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            darkMode
              ? 'hover:bg-white/10 text-gray-500 hover:text-cyan-400 hover:shadow-[0_0_8px_rgba(0,229,255,0.15)]'
              : 'hover:bg-gray-200 text-gray-400 hover:text-indigo-500'
          }`}
          title="展开侧栏"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className={`w-4 h-px my-1 ${darkMode ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />
        <button
          onClick={() => newSession()}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            darkMode
              ? 'hover:bg-white/10 text-gray-500 hover:text-cyan-400 hover:shadow-[0_0_8px_rgba(0,229,255,0.15)]'
              : 'hover:bg-gray-200 text-gray-500 hover:text-indigo-500'
          }`}
          title="新建对话 (Ctrl+N)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Session count badge at bottom */}
        <div className="mt-auto">
          <span className={`text-[10px] font-mono tabular-nums ${
            darkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>{sessions.length}</span>
        </div>
      </div>
    );
  }

  // ── Full sidebar ──
  return (
    <div className={`flex flex-col w-sidebar border-r h-full overflow-hidden ${
      darkMode
        ? 'glass border-white/5'
        : 'bg-gradient-b-to-b from-white to-gray-50 border-gray-200'
    }`}>
      {/* Brand header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${
              darkMode
                ? 'gradient-cyber shadow-[0_0_16px_rgba(0,229,255,0.35)]'
                : 'gradient-cyber shadow-md'
            }`}>
              <Sparkles className="w-4 h-4 text-white" />
              {darkMode && (
                <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md animate-pulse" />
              )}
            </div>
            <div>
              <span className={`font-bold text-sm tracking-wide block -mb-0.5 ${
                darkMode ? 'text-white/90' : 'text-gray-800'
              }`}>DeepSeek</span>
              <span className={`text-[10px] font-mono ${
                darkMode ? 'text-cyan-400/40' : 'text-indigo-400/60'
              }`}>AI Terminal v2</span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title="收起侧栏"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New chat button */}
        <button
          onClick={() => newSession()}
          className={`group flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            darkMode
              ? 'bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400/80 hover:text-cyan-300 border border-cyan-500/10 hover:border-cyan-500/30 hover:shadow-[0_0_14px_rgba(0,229,255,0.08)]'
              : 'bg-white hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span>新建对话</span>
          <span className="ml-auto text-[10px] opacity-60">Ctrl+N</span>
        </button>
      </div>

      {/* Search */}
      {sessions.length > 3 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索对话..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none transition-all ${
                darkMode
                  ? 'bg-white/[0.03] border border-white/[0.05] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 text-white/70 placeholder-gray-600'
                  : 'bg-gray-100/80 border border-transparent focus:border-indigo-300 text-gray-700 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
        {groups.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-32 gap-2 ${
            darkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <MessageSquare className="w-6 h-6 opacity-20" />
            <span className="text-xs">
              {search.trim() ? '未找到匹配的对话' : '暂无对话记录'}
            </span>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest select-none ${
                darkMode ? 'text-gray-500/80' : 'text-gray-400'
              }`}>
                {group.label}
              </div>
              {group.items.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  onClick={() => switchSession(sessionItem.id)}
                  className={cn(
                    'group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-all duration-150',
                    sessionItem.id === activeId
                      ? darkMode
                        ? 'bg-gradient-to-r from-cyan-500/[0.1] to-transparent text-cyan-400 border border-cyan-500/10 shadow-[0_0_8px_rgba(0,229,255,0.05)]'
                        : 'bg-indigo-50 text-indigo-600 shadow-sm border border-transparent'
                      : darkMode
                      ? 'hover:bg-white/[0.03] text-white/55 hover:text-white/80'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                  )}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    sessionItem.id === activeId ? 'opacity-100' : 'opacity-35'
                  }`} />
                  <span className="flex-1 truncate text-xs font-medium">{sessionItem.title}</span>

                  {/* Pin button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); pinSession(sessionItem.id); }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all',
                      sessionItem.pinned
                        ? darkMode ? 'opacity-100 text-cyan-400/70' : 'opacity-100 text-indigo-400'
                        : darkMode
                          ? 'text-gray-600 hover:text-cyan-400'
                          : 'text-gray-300 hover:text-indigo-500'
                    )}
                    title={sessionItem.pinned ? '取消置顶' : '置顶'}
                  >
                    {sessionItem.pinned
                      ? <PinOff className="w-3 h-3" />
                      : <Pin className="w-3 h-3" />
                    }
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('确定要删除此对话吗？')) deleteSession(sessionItem.id); }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all',
                      darkMode
                        ? 'text-gray-600 hover:text-red-400 hover:bg-red-400/10'
                        : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                    )}
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-3 border-t flex-shrink-0 ${
        darkMode ? 'border-white/[0.04]' : 'border-gray-200/60'
      }`}>
        <div className={`flex items-center justify-between text-[11px] ${
          darkMode ? 'text-gray-500/70' : 'text-gray-400'
        }`}>
          <span>{sessions.length} 个会话</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.05] font-mono text-[10px]">
            Ctrl+/
          </kbd>
        </div>
      </div>
    </div>
  );
}
