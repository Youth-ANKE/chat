import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { SettingsPanel } from './SettingsPanel';
import { ShortcutHelp } from './ShortcutHelp';
import { UsagePanel } from './UsagePanel';
import { TechBackground } from './TechBackground';
import { useChatStore } from '../stores/chatStore';
import { useUsageStore } from '../stores/usageStore';
import { createMessage, generateTitle } from '../lib/session';
import { streamChat } from '../lib/stream';
import { Settings, Menu, Trash2, Download, Zap, BarChart3, Headphones, Music } from 'lucide-react';
import type { ModelName } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick, playToggleOn, playToggleOff, playSend, playStop, playDelete, playExport, playRegenerate } from '../lib/sound';
import { speakChunk, flushSpeech, stopSpeech } from '../lib/speech';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

export function ChatLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const speechEnabled = useSettingsStore((s) => s.settings.speechEnabled);
  const toggleSpeechEnabled = useSettingsStore((s) => s.toggleSpeechEnabled);
  const musicEnabled = useSettingsStore((s) => s.settings.musicEnabled);
  const toggleMusicEnabled = useSettingsStore((s) => s.toggleMusicEnabled);

  const activeId = useChatStore((s) => s.activeId);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const appendContent = useChatStore((s) => s.appendContent);
  const appendReasoning = useChatStore((s) => s.appendReasoning);
  const renameSession = useChatStore((s) => s.renameSession);
  const getActiveMessages = useChatStore((s) => s.getActiveMessages);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setMessages = useChatStore((s) => s.setMessages);
  const exportConversation = useChatStore((s) => s.exportConversation);
  const newSession = useChatStore((s) => s.newSession);
  const setWebSearch = useChatStore((s) => s.setWebSearch);

  const addUsageRecord = useUsageStore((s) => s.addRecord);
  const settings = useSettingsStore((s) => s.settings);

  const activeMessages = getActiveMessages();
  const session = useChatStore((s) => s.sessions.find(sess => sess.id === s.activeId));

  // Stop speech when switching sessions
  useEffect(() => {
    stopSpeech();
  }, [activeId]);

  // Auto-generate title from first user message
  const titleGeneratedRef = useRef(false);
  useEffect(() => {
    const msgs = getActiveMessages();
    if (msgs.length >= 2 && !titleGeneratedRef.current && session) {
      const firstUser = msgs.find((m) => m.role === 'user');
      if (firstUser) {
        renameSession(session.id, generateTitle(firstUser.content));
        titleGeneratedRef.current = true;
      }
    }
    if (msgs.length === 0) {
      titleGeneratedRef.current = false;
    }
  }, [activeMessages.length, session?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === '/') {
        e.preventDefault();
        setShortcutOpen((v) => !v);
      }
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        stopSpeech();
        newSession();
      }
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
      if (ctrl && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (ctrl && e.key === 'E') {
        e.preventDefault();
        handleExport();
      }
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId, session]);

  const doStream = useCallback(
    async (
      localActiveId: string,
      messages: { role: 'user' | 'assistant'; content: string; attachments?: { type: 'image' | 'text'; mimeType: string; data: string; name: string }[] }[],
      assistantMsgId: string
    ) => {
      const currentSession = useChatStore.getState().sessions.find((s) => s.id === localActiveId);
      if (!currentSession) return;

      const abortController = new AbortController();
      abortRef.current = abortController;
      setIsStreaming(true);

      // Stop any previous speech
      stopSpeech();

      // Capture usage data for stats tracking
      let usageCaptured = false;

      // Apply context message limit (trim older messages)
      let streamMessages = messages;
      const ctxLimit = settings.contextLimit ?? 0;
      if (ctxLimit > 0 && messages.length > ctxLimit) {
        // Keep the first user message + last N messages
        const keepFromEnd = ctxLimit - 1;
        streamMessages = [
          messages[0],
          ...messages.slice(messages.length - keepFromEnd),
        ];
      }

      await streamChat(
        {
          messages: streamMessages,
          model: currentSession.model,
          temperature: currentSession.temperature,
          max_tokens: currentSession.maxTokens ?? settings.maxTokens,
          thinking: currentSession.thinking,
          systemPrompt: currentSession.systemPrompt,
          webSearch: currentSession.webSearch,
          topP: currentSession.topP ?? settings.topP,
          streamOutput: settings.streamOutput,
        },
        {
          signal: abortController.signal,
          onToken: (token) => {
            appendContent(localActiveId, assistantMsgId, token);
            if (useSettingsStore.getState().settings.speechEnabled) {
              speakChunk(token);
            }
          },
          onReasoning: (chunk) => {
            appendReasoning(localActiveId, assistantMsgId, chunk);
          },
          onRetry: () => {
            // Clear stale partial content before retry stream starts
            updateMessage(localActiveId, assistantMsgId, {
              content: '',
              reasoning: undefined,
            });
          },
          onUsage: (usage) => {
            if (!usageCaptured) {
              usageCaptured = true;
              addUsageRecord({
                sessionId: localActiveId,
                sessionTitle: currentSession.title,
                model: currentSession.model,
                usage,
              });
            }
          },
          onError: (error) => {
            updateMessage(localActiveId, assistantMsgId, {
              status: 'error',
              error,
            });
            setIsStreaming(false);
          },
          onDone: () => {
            updateMessage(localActiveId, assistantMsgId, { status: 'done' });
            setIsStreaming(false);
            if (useSettingsStore.getState().settings.speechEnabled) {
              flushSpeech();
            }
          },
        }
      );
    },
    [appendContent, appendReasoning, updateMessage, addUsageRecord, settings]
  );

  const handleSend = useCallback(
    async (content: string, attachments?: { type: 'image' | 'text'; mimeType: string; data: string; name: string }[]) => {
      if (!activeId || isStreaming) return;
      playSend();
      const currentSession = useChatStore.getState().sessions.find((s) => s.id === activeId);
      if (!currentSession) return;

      const userMsg = createMessage('user', content, 'done');
      if (attachments && attachments.length > 0) {
        userMsg.attachments = attachments.map((a, i) => ({
          id: `att-${Date.now()}-${i}`,
          name: a.name,
          type: a.type,
          mimeType: a.mimeType,
          data: a.data,
          size: a.data.length,
        }));
      }
      addMessage(activeId, userMsg);

      const assistantMsg = createMessage('assistant', '', 'streaming');
      addMessage(activeId, assistantMsg);

      const messages = [...currentSession.messages, userMsg].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          type: a.type,
          mimeType: a.mimeType,
          data: a.data,
          name: a.name,
        })),
      }));

      await doStream(activeId, messages, assistantMsg.id);
    },
    [activeId, isStreaming, addMessage, doStream]
  );

  const handleEdit = useCallback(
    async (msgId: string, newContent: string) => {
      if (!activeId || isStreaming) return;
      const currentSession = useChatStore.getState().sessions.find((s) => s.id === activeId);
      if (!currentSession) return;

      setEditingMsgId(null);

      const msgs = currentSession.messages;
      const idx = msgs.findIndex((m) => m.id === msgId);
      if (idx === -1) return;

      // Keep messages up to and including the edited one, replace its content
      const keepMsgs = msgs.slice(0, idx);
      const editedUser = createMessage('user', newContent, 'done');

      // Set the kept messages + edited user
      setMessages(activeId, [...keepMsgs, editedUser]);

      // Now trigger stream
      const assistantMsg = createMessage('assistant', '', 'streaming');
      addMessage(activeId, assistantMsg);

      const streamMessages = [...keepMsgs, editedUser].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          type: a.type,
          mimeType: a.mimeType,
          data: a.data,
          name: a.name,
        })),
      }));

      await doStream(activeId, streamMessages, assistantMsg.id);
    },
    [activeId, isStreaming, setMessages, addMessage, doStream]
  );

  const handleRegenerate = useCallback(async () => {
    if (!activeId || isStreaming) return;
    playRegenerate();
    const currentSession = useChatStore.getState().sessions.find((s) => s.id === activeId);
    if (!currentSession) return;
    const msgs = currentSession.messages;

    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const removeIdx = msgs.length - lastUserIdx;

    clearMessages(activeId);
    const keepMsgs = msgs.slice(0, removeIdx);
    for (const m of keepMsgs) {
      addMessage(activeId, m);
    }

    const lastUser = msgs[removeIdx - 1];
    if (!lastUser) return;
    const userMsg = createMessage('user', lastUser.content, 'done');
    addMessage(activeId, userMsg);
    const assistantMsg = createMessage('assistant', '', 'streaming');
    addMessage(activeId, assistantMsg);

    const streamMessages = [...keepMsgs.slice(0, -1), userMsg].map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      attachments: m.attachments?.map((a) => ({
        type: a.type,
        mimeType: a.mimeType,
        data: a.data,
        name: a.name,
      })),
    }));

    await doStream(activeId, streamMessages, assistantMsg.id);
  }, [activeId, isStreaming, addMessage, updateMessage, clearMessages, doStream]);

  const handleStop = useCallback(() => {
    playStop();
    stopSpeech();
    abortRef.current?.abort();
    if (activeId) {
      const msgs = getActiveMessages();
      const streaming = msgs.find((m) => m.status === 'streaming');
      if (streaming) {
        updateMessage(activeId, streaming.id, { status: 'done' });
      }
    }
    setIsStreaming(false);
  }, [activeId, getActiveMessages, updateMessage]);

  const handleExport = useCallback(() => {
    if (!activeId) return;
    playExport();
    const md = exportConversation(activeId);
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.title ?? 'conversation'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeId, session, exportConversation]);

  const handleClear = useCallback(() => {
    if (!activeId) return;
    playDelete();
    if (activeMessages.length === 0) return;
    if (!confirm('确定要清空当前对话吗？此操作不可撤销。')) return;
    clearMessages(activeId);
  }, [activeId, activeMessages, clearMessages]);

  const handleToggleWebSearch = useCallback(() => {
    if (!activeId) return;
    // Read latest state directly from store to avoid stale closure
    const latest = useChatStore.getState().sessions.find((s) => s.id === activeId);
    const next = !latest?.webSearch;
    setWebSearch(activeId, next);
    if (next) playToggleOn();
    else playToggleOff();
  }, [activeId, setWebSearch]);

  const totalTokens = activeMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  return (
    <div className={`flex h-full ${darkMode ? 'bg-space-dark text-gray-100' : 'bg-chat text-gray-900'}`}>
      {/* Tech background particles */}
      <TechBackground dark={darkMode} />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => { playClick(); setSidebarCollapsed((v) => !v); }}
      />

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col min-w-0 relative ${darkMode ? 'scanline-overlay' : ''}`}>
        {/* Top bar */}
        <header className={`flex items-center justify-between px-4 py-2.5 border-b z-10 ${
          darkMode
            ? 'glass border-white/5'
            : 'glass-light border-gray-200/60'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {sidebarCollapsed && (
              <button
                onClick={() => { playClick(); setSidebarCollapsed(false); }}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-cyan-400' : 'hover:bg-gray-200/60 text-gray-400'
                }`}
                title="展开侧栏 (Ctrl+B)"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_6px_rgba(0,229,255,0.6)] ${isStreaming ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
              <h2 className={`text-sm font-semibold truncate max-w-[200px] ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
                {session?.title ?? '新对话'}
              </h2>
            </div>
            {session && (
              <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] ${
                darkMode ? 'bg-white/[0.04] text-cyan-400/70 border border-cyan-500/10' : 'bg-gray-100 text-indigo-500'
              }`}>
                <Zap className="w-2.5 h-2.5" />
                {session.model === 'deepseek-v4-pro' ? 'V4 Pro' : 'V4 Flash'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Token count */}
            {activeMessages.length > 0 && (
              <span className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono ${
                darkMode ? 'text-cyan-400/50 bg-white/[0.02] border border-white/5' : 'text-gray-400 bg-gray-100'
              }`}>
                ≈{totalTokens.toLocaleString()} tokens
              </span>
            )}
            {activeMessages.length >= 2 && !isStreaming && (
              <button
                onClick={handleRegenerate}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-cyan-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="重新生成"
              >
                重试
              </button>
            )}
            <button
              onClick={handleClear}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100 hover:text-red-500'
              }`}
              title="清空对话 (Ctrl+K)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExport}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-cyan-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="导出 Markdown (Ctrl+Shift+E)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { playClick(); setUsageOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-emerald-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="用量统计"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                toggleSpeechEnabled();
                playClick();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                speechEnabled
                  ? darkMode ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/15' : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                  : darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={speechEnabled ? '关闭朗读' : '开启朗读'}
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                toggleMusicEnabled();
                playClick();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                musicEnabled
                  ? darkMode ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  : darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={musicEnabled ? '关闭背景音乐' : '开启背景音乐'}
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playClick(); setSettingsOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <MessageList
          messages={activeMessages}
          onSend={handleSend}
          editingMsgId={editingMsgId}
          onEdit={handleEdit}
          onStartEdit={setEditingMsgId}
          onCancelEdit={() => setEditingMsgId(null)}
        />

        {/* Composer */}
        <Composer
          ref={inputRef}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          model={session?.model as ModelName}
          disabled={editingMsgId !== null}
          webSearch={session?.webSearch ?? false}
          onToggleWebSearch={handleToggleWebSearch}
        />
      </div>

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => { playClick(); setSettingsOpen(false); }} />

      {/* Usage stats panel */}
      <UsagePanel open={usageOpen} onClose={() => { playClick(); setUsageOpen(false); }} />

      {/* Shortcut help */}
      <ShortcutHelp open={shortcutOpen} onClose={() => { playClick(); setShortcutOpen(false); }} />
    </div>
  );
}
