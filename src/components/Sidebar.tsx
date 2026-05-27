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
  Star,
  Upload,
  Tag,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { cn } from '../lib/utils';
import { playClick, playNewSession, playDelete, playToggleOn, playToggleOff } from '../lib/sound';
import { stopSpeech } from '../lib/speech';
import { useConfirm } from './ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenImport?: () => void;
  onOpenBookmarks?: () => void;
  onOpenTags?: (sessionId: string) => void;
}

function groupByDate(sessions: { id: string; title: string; updatedAt: string; pinned?: boolean; archived?: boolean }[]) {
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

export function Sidebar({ collapsed, onToggle, onOpenImport, onOpenBookmarks, onOpenTags }: SidebarProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const { confirm } = useConfirm();

  const sessions = useChatStore((s) => s.sessions);
  const activeId = useChatStore((s) => s.activeId);
  const newSession = useChatStore((s) => s.newSession);
  const switchSession = useChatStore((s) => s.switchSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const pinSession = useChatStore((s) => s.pinSession);
  const toggleArchive = useChatStore((s) => s.toggleArchive);
  const showArchived = useSettingsStore((s) => s.settings.showArchived);

  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const bookmarkCount = bookmarks.length;

  // Separate active and archived
  const activeSessions = useMemo(() => sessions.filter((s) => !s.archived), [sessions]);
  const archivedSessions = useMemo(() => sessions.filter((s) => s.archived), [sessions]);

  const filtered = useMemo(() => {
    const source = showArchived ? sessions : activeSessions;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter((s) => s.title.toLowerCase().includes(q));
  }, [showArchived, activeSessions, sessions, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Collapsed sidebar (icon strip) ──
  if (collapsed) {
    return (
      <div className={`flex flex-col items-center gap-3 py-4 border-r w-12 h-full ${
        darkMode
          ? 'backdrop-blur-[45px] saturate-[200%] brightness-[1.04] bg-white/[0.025] border-r border-white/[0.06]'
          : 'glass-light-thin border-r border-gray-200/20'
      }`}>
        {/* Logo dot */}
        <div className={`w-2.5 h-2.5 rounded-full mb-1 transition-shadow duration-300 ${
          darkMode
            ? 'bg-gradient-to-b from-white/90 via-blue-200 to-purple-200 shadow-[0_0_10px_rgba(255,255,255,0.25),0_0_30px_rgba(200,210,255,0.12)]'
            : 'bg-gradient-to-b from-indigo-400 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
        }`} />
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-xl transition-all duration-200 apple-btn ${
            darkMode
              ? 'hover:bg-white/[0.06] text-white/30 hover:text-white/70'
              : 'hover:bg-gray-200/60 text-gray-400 hover:text-gray-600'
          }`}
          title="展开侧栏"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className={`w-4 h-px my-1 ${darkMode ? 'bg-white/[0.05]' : 'bg-gray-200'}`} />
        <button
          onClick={() => { playNewSession(); stopSpeech(); newSession(); }}
          className={`p-1.5 rounded-xl transition-all duration-200 apple-btn ${
            darkMode
              ? 'hover:bg-white/[0.06] text-white/30 hover:text-white/70'
              : 'hover:bg-gray-200/60 text-gray-500 hover:text-gray-600'
          }`}
          title="新建对话 (Ctrl+N)"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Bottom actions */}
        <div className="mt-auto space-y-1">
          <button
            onClick={onOpenBookmarks}
            className={`p-1.5 rounded-xl transition-all duration-200 apple-btn ${
              darkMode ? 'hover:bg-white/[0.06] text-white/25 hover:text-amber-300' : 'hover:bg-gray-200/60 text-gray-400 hover:text-amber-500'
            }`}
            title={t('sidebar.bookmarks')}
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenImport}
            className={`p-1.5 rounded-xl transition-all duration-200 apple-btn ${
              darkMode ? 'hover:bg-white/[0.06] text-white/25 hover:text-white/60' : 'hover:bg-gray-200/60 text-gray-400 hover:text-gray-600'
            }`}
            title={t('common.import')}
          >
            <Upload className="w-4 h-4" />
          </button>
          <span className={`text-[10px] font-mono tabular-nums block text-center select-none ${
            darkMode ? 'text-white/20' : 'text-gray-400'
          }`}>{sessions.length}</span>
        </div>
      </div>
    );
  }

  // ── Full sidebar ──
  return (
    <div className={`flex flex-col w-sidebar border-r h-full overflow-hidden ${
      darkMode
        ? 'backdrop-blur-[50px] saturate-[200%] brightness-[1.04] bg-white/[0.035] border-r border-white/[0.06]'
        : 'glass-light-mode border-r border-gray-200/20'
    }`}>
      {/* Brand header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`relative w-8 h-8 rounded-2xl flex items-center justify-center overflow-hidden ${
              darkMode
                ? 'bg-white/[0.08] backdrop-blur-md shadow-[0_0_24px_rgba(200,220,255,0.1)] border border-white/[0.08]'
                : 'bg-gradient-to-br from-indigo-500/90 to-purple-600/90 shadow-md shadow-indigo-500/20'
            }`}>
              <Sparkles className={`w-4 h-4 ${darkMode ? 'text-white/80' : 'text-white'}`} />
              {darkMode && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
              )}
            </div>
            <div>
              <span className={`font-bold text-sm tracking-tight block -mb-0.5 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>DeepSeek</span>
              <span className={`text-[10px] font-mono ${
                darkMode ? 'text-white/25' : 'text-gray-400'
              }`}>AI Terminal v2</span>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-white/[0.06] text-white/30 hover:text-white/60' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title="收起侧栏"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New chat button — Apple style pill */}
        <button
          onClick={() => { playNewSession(); stopSpeech(); newSession(); }}
          className={`group flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 apple-btn ${
            darkMode
              ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white/80 border border-white/[0.05] hover:border-white/[0.12] shadow-sm hover:shadow-md'
              : 'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 border border-gray-200/60 hover:border-gray-300 shadow-sm hover:shadow-md'
          }`}
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>{t('sidebar.newChat')}</span>
          <span className="ml-auto text-[10px] opacity-40">⌘N</span>
        </button>
      </div>

      {/* Search */}
      {sessions.length > 3 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
              darkMode ? 'text-white/20' : 'text-gray-400'
            }`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索对话..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all duration-200 ${
                darkMode
                  ? 'bg-white/[0.03] border border-white/[0.04] focus:border-white/[0.1] focus:bg-white/[0.05] text-white/60 placeholder-white/20'
                  : 'bg-gray-100/60 border border-transparent focus:border-gray-300 focus:bg-white text-gray-700 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
        {groups.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-32 gap-2 ${
            darkMode ? 'text-white/20' : 'text-gray-400'
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
                darkMode ? 'text-white/15' : 'text-gray-400'
              }`}>
                {group.label}
              </div>
              {group.items.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  onClick={() => { playClick(); switchSession(sessionItem.id); }}
                  className={cn(
                    'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all duration-200',
                    sessionItem.id === activeId
                      ? darkMode
                        ? 'bg-white/[0.06] text-white/85 border border-white/[0.06] shadow-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-200/60'
                      : darkMode
                      ? 'hover:bg-white/[0.03] text-white/40 hover:text-white/65'
                      : 'hover:bg-gray-100/60 text-gray-500 hover:text-gray-700'
                  )}
                >
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    sessionItem.id === activeId
                      ? 'opacity-90'
                      : 'opacity-25 group-hover:opacity-45'
                  }`} />
                  <span className="flex-1 truncate text-xs font-medium">{sessionItem.title}</span>

                  {/* Pin button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); playClick(); pinSession(sessionItem.id); }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-0.5 rounded-lg transition-all',
                      sessionItem.pinned
                        ? darkMode ? 'opacity-100 text-white/50' : 'opacity-100 text-indigo-400'
                        : darkMode
                          ? 'text-white/30 hover:text-white/60'
                          : 'text-gray-300 hover:text-gray-500'
                    )}
                    title={sessionItem.pinned ? '取消置顶' : '置顶'}
                  >
                    {sessionItem.pinned
                      ? <PinOff className="w-3 h-3" />
                      : <Pin className="w-3 h-3" />
                    }
                  </button>

                  {/* Archive */}
                  <button
                    onClick={(e) => { e.stopPropagation(); playClick(); toggleArchive(sessionItem.id); }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-0.5 rounded-lg transition-all',
                      darkMode
                        ? 'text-white/20 hover:text-amber-300'
                        : 'text-gray-300 hover:text-amber-500'
                    )}
                    title={sessionItem.archived ? '取消归档' : '归档'}
                  >
                    {sessionItem.archived
                      ? <ArchiveRestore className="w-3 h-3" />
                      : <Archive className="w-3 h-3" />
                    }
                  </button>

                  {/* Delete */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const ok = await confirm({
                        title: '删除对话',
                        message: `确定要删除「${sessionItem.title}」吗？此操作不可撤销。`,
                        variant: 'danger',
                        confirmLabel: '删除',
                      });
                      if (!ok) return;
                      playDelete();
                      deleteSession(sessionItem.id);
                    }}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-0.5 rounded-lg transition-all',
                      darkMode
                        ? 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
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
      <div className={`px-4 py-3 border-t flex-shrink-0 space-y-2 ${
        darkMode ? 'border-white/[0.04]' : 'border-gray-200/40'
      }`}>
        {/* Archive toggle */}
        {archivedSessions.length > 0 && (
          <button
            onClick={() => {
              playClick();
              useSettingsStore.getState().setShowArchived(!showArchived);
            }}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] transition-colors apple-btn ${
              showArchived
                ? darkMode ? 'bg-white/[0.06] text-white/60 border border-white/[0.08]' : 'bg-white text-gray-600 shadow-sm border border-gray-200'
                : darkMode ? 'hover:bg-white/[0.04] text-white/30' : 'hover:bg-gray-200/60 text-gray-400'
            }`}
          >
            <Archive className="w-3 h-3" />
            {showArchived ? '显示活跃会话' : `已归档 (${archivedSessions.length})`}
          </button>
        )}
        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenImport}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] transition-colors apple-btn ${
              darkMode ? 'hover:bg-white/[0.05] text-white/30 hover:text-white/60' : 'hover:bg-gray-200/60 text-gray-400 hover:text-gray-600'
            }`}
            title={t('common.import')}
          >
            <Upload className="w-3 h-3" />
            {t('common.import')}
          </button>
          <button
            onClick={onOpenBookmarks}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] transition-colors apple-btn ${
              darkMode ? 'hover:bg-white/[0.05] text-white/30 hover:text-amber-300' : 'hover:bg-gray-200/60 text-gray-400 hover:text-amber-500'
            }`}
            title={t('sidebar.bookmarks')}
          >
            <Star className="w-3 h-3" />
            {t('sidebar.bookmarks')}
            {bookmarkCount > 0 && (
              <span className={`text-[10px] ${darkMode ? 'text-white/25' : 'text-gray-400'}`}>({bookmarkCount})</span>
            )}
          </button>
        </div>
        <div className={`flex items-center justify-between text-[11px] ${
          darkMode ? 'text-white/15' : 'text-gray-400'
        }`}>
          <span>{activeSessions.length} {t('sidebar.sessions')}</span>
          <kbd className="px-1.5 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04] font-mono text-[10px] text-white/30">
            ⌘/
          </kbd>
        </div>
      </div>
    </div>
  );
}
