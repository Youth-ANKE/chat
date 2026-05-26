import { useState, useCallback, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MessageList, type MessageListHandle } from './MessageList';
import { Composer, type ComposerHandle } from './Composer';
import { SettingsPanel } from './SettingsPanel';
import { ShortcutHelp } from './ShortcutHelp';
import { AboutPanel } from './AboutPanel';
import { UsagePanel } from './UsagePanel';
import { PromptLibrary } from './PromptLibrary';
import { TechBackground } from './TechBackground';
import { SharePanel } from './SharePanel';
import { ImportDialog } from './ImportDialog';
import { ArtifactPreview } from './ArtifactPreview';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { TagsPanel } from './TagsPanel';
import { OfflineBanner } from './OfflineBanner';
import { GlobalSearch } from './GlobalSearch';
import { ContextBar } from './ContextBar';
import { ModelSelector } from './ModelSelector';
import { TemplateSelector } from './TemplateSelector';
import { ComparisonPanel } from './ComparisonPanel';
import { ScrollNavigator } from './ScrollNavigator';
import { useChatStore } from '../stores/chatStore';
import { useUsageStore } from '../stores/usageStore';
import { useProviderStore } from '../stores/providerStore';
import { getApiBaseUrl } from '../lib/provider-adapter';
import { createMessage, generateTitle, generateAITitle } from '../lib/session';
import { streamChat } from '../lib/stream';
import { Settings, Menu, Trash2, Download, Zap, BarChart3, Headphones, Music, Share2, Database, Search, FileJson, HelpCircle, Info, Bot, CalendarClock, GitCompare, Image as ImageIcon } from 'lucide-react';
import type { ModelName, ChatMessage, ConversationTemplate } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick, playToggleOn, playToggleOff, playSend, playStop, playDelete, playExport, playRegenerate } from '../lib/sound';
import { speakChunk, flushSpeech, stopSpeech } from '../lib/speech';
import { notifyResponseDone, notifyError } from '../lib/notification';
import { exportAsPNG, exportAsPDF } from '../lib/export-file';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { saveSession } from '../lib/storage';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

export function ChatLayout() {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState<string | null>(null);
  const [artifactCode, setArtifactCode] = useState<{ code: string; lang: string } | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<ComposerHandle>(null);
  const messageListRef = useRef<MessageListHandle>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { confirm } = useConfirm();

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
  const exportConversationJSON = useChatStore((s) => s.exportConversationJSON);
  const newSession = useChatStore((s) => s.newSession);
  const setWebSearch = useChatStore((s) => s.setWebSearch);
  const notificationsEnabled = useSettingsStore((s) => s.settings.notificationsEnabled);
  const autoTitleAI = useSettingsStore((s) => s.settings.autoTitleAI);

  const addUsageRecord = useUsageStore((s) => s.addRecord);
  const settings = useSettingsStore((s) => s.settings);

  const activeMessages = getActiveMessages();
  const session = useChatStore((s) => s.sessions.find(sess => sess.id === s.activeId));

  // Stop speech when switching sessions
  useEffect(() => {
    stopSpeech();
    titleGeneratedRef.current = false;
  }, [activeId]);

  // Online/offline detection
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // Check for shared conversation in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(shareData)));
        const sharedSession = {
          id: nanoid(),
          title: data.t || data.title || 'Shared Chat',
          messages: (data.msgs || data.messages || []).map((m: { r: string; c: string; re?: string; role?: string; content?: string; reasoning?: string }) => ({
            id: nanoid(),
            role: (m.r || m.role) === 'assistant' ? 'assistant' as const : 'user' as const,
            content: m.c || m.content || '',
            reasoning: m.re || m.reasoning,
            createdAt: new Date().toISOString(),
            status: 'done' as const,
          })),
          model: (data.m || 'deepseek-v4-flash') as ModelName,
          thinking: true,
          temperature: 0.7,
          topP: 1.0,
          maxTokens: 4096,
          webSearch: false,
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const { sessions } = useChatStore.getState();
        useChatStore.setState({
          sessions: [sharedSession, ...sessions],
          activeId: sharedSession.id,
        });
        saveSession(sharedSession);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        toast('已导入分享的对话', 'success');
      } catch { /* ignore invalid share data */ }
    }
  }, [toast]);

  // Auto-generate title from first user message (with optional AI generation)
  const titleGeneratedRef = useRef(false);
  useEffect(() => {
    const msgs = getActiveMessages();
    if (msgs.length >= 2 && !titleGeneratedRef.current && session) {
      const firstUser = msgs.find((m) => m.role === 'user');
      if (firstUser) {
        titleGeneratedRef.current = true;
        if (autoTitleAI) {
          // AI-generated title (async, non-blocking)
          generateAITitle(firstUser.content, session.model, settings)
            .then((title) => {
              renameSession(session.id, title);
            })
            .catch(() => {
              // Fallback to simple truncation
              renameSession(session.id, generateTitle(firstUser.content));
            });
        } else {
          renameSession(session.id, generateTitle(firstUser.content));
        }
      }
    }
    if (msgs.length === 0) {
      titleGeneratedRef.current = false;
    }
  }, [activeMessages.length, session?.id]);

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

      const providers = useProviderStore.getState().providers;
      const apiBase = getApiBaseUrl(currentSession.providerId ?? 'deepseek', providers);

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
          apiBase,
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
            if (useSettingsStore.getState().settings.notificationsEnabled) {
              notifyError(error);
            }
          },
          onDone: () => {
            updateMessage(localActiveId, assistantMsgId, { status: 'done' });
            setIsStreaming(false);
            if (useSettingsStore.getState().settings.speechEnabled) {
              flushSpeech();
            }
            if (useSettingsStore.getState().settings.notificationsEnabled) {
              notifyResponseDone(currentSession.title);
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
      if (replyTarget) {
        userMsg.replyTo = replyTarget.id;
        setReplyTarget(null);
      }
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

  const handleExport = useCallback((format: 'md' | 'json' = 'md') => {
    if (!activeId) return;
    playExport();
    const content = format === 'json'
      ? exportConversationJSON(activeId)
      : exportConversation(activeId);
    if (!content) return;
    const mimeType = format === 'json'
      ? 'application/json;charset=utf-8'
      : 'text/markdown;charset=utf-8';
    const ext = format === 'json' ? 'json' : 'md';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session?.title ?? 'conversation'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast('导出成功', 'success');
  }, [activeId, session, exportConversation, exportConversationJSON, toast]);

  const handleClear = useCallback(async () => {
    if (!activeId) return;
    if (activeMessages.length === 0) return;
    const ok = await confirm({
      title: '清空对话',
      message: '确定要清空当前对话吗？此操作不可撤销。',
      variant: 'danger',
      confirmLabel: '清空',
    });
    if (!ok) return;
    playDelete();
    clearMessages(activeId);
    toast('对话已清空', 'success');
  }, [activeId, activeMessages, clearMessages, confirm, toast]);

  const handlePromptSelect = useCallback((promptText: string) => {
    inputRef.current?.insertText(promptText);
  }, []);

  // Share button handler
  const handleShare = useCallback(() => {
    if (!session) return;
    playClick();
    setShareOpen(true);
  }, [session]);

  // Branch conversation
  const handleBranch = useCallback(async (msgId: string) => {
    if (!activeId || !session) return;
    const msgs = session.messages;
    const idx = msgs.findIndex((m) => m.id === msgId);
    if (idx === -1) return;

    playClick();
    const branchMsgs = msgs.slice(0, idx + 1);
    const newSess = {
      id: nanoid(),
      title: `${session.title} (fork)`,
      messages: branchMsgs,
      model: session.model,
      thinking: session.thinking,
      temperature: session.temperature,
      topP: session.topP,
      maxTokens: session.maxTokens,
      webSearch: session.webSearch,
      parentSessionId: session.id,
      branchPoint: idx,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const { sessions } = useChatStore.getState();
    useChatStore.setState({
      sessions: [newSess, ...sessions],
      activeId: newSess.id,
    });
    saveSession(newSess);
    toast('已分叉对话', 'success');
  }, [activeId, session, toast]);

  // Tag management
  const handleAddTag = useCallback((tag: string) => {
    if (!activeId) return;
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeId) return s;
        const tags = s.tags || [];
        const updated = { ...s, tags: [...tags, tag], updatedAt: new Date().toISOString() };
        saveSession(updated);
        return updated;
      }),
    }));
  }, [activeId]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!activeId) return;
    useChatStore.setState((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== activeId) return s;
        const tags = (s.tags || []).filter((t) => t !== tag);
        const updated = { ...s, tags, updatedAt: new Date().toISOString() };
        saveSession(updated);
        return updated;
      }),
    }));
  }, [activeId]);

  const handleTemplateSelect = useCallback((tpl: ConversationTemplate) => {
    const s = newSession();
    useChatStore.getState().setSystemPrompt(s.id, tpl.systemPrompt);
    renameSession(s.id, tpl.name);
  }, [newSession, renameSession]);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyTarget(msg);
    inputRef.current?.textarea?.focus();
  }, []);

  const handleExportImage = useCallback(async (format: 'png' | 'pdf') => {
    playExport();
    const container = document.querySelector('.chat-messages-container');
    if (!container) return;
    try {
      let blob: Blob | null = null;
      if (format === 'png') {
        blob = await exportAsPNG(container as HTMLElement);
      } else {
        blob = await exportAsPDF(container as HTMLElement);
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session?.title ?? 'conversation'}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast(`导出 ${format.toUpperCase()} 成功`, 'success');
      }
    } catch {
      toast('导出失败，请重试', 'error');
    }
  }, [session, toast]);

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
        inputRef.current?.textarea?.focus();
      }
      if (ctrl && e.key === 'E') {
        e.preventDefault();
        handleExport();
      }
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }
      if (ctrl && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        const currentSearch = messageSearch;
        // toggle search bar via state trick
        if (!currentSearch) {
          setMessageSearch('');
        } else {
          setMessageSearch('');
        }
        // Focus the search input
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
          if (searchInput) {
            setMessageSearch('');
            searchInput.focus();
          }
        }, 50);
      }
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        setPromptLibraryOpen((v) => !v);
      }
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setGlobalSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setMessageSearch('');
        setPromptLibraryOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeId, session, handleExport, handleClear, messageSearch]);

  return (
    <div className={`flex h-full ${darkMode ? 'bg-space-dark text-gray-100' : 'bg-chat text-gray-900'}`}>
      {/* Tech background particles */}
      <TechBackground dark={darkMode} />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => { playClick(); setSidebarCollapsed((v) => !v); }}
        onOpenImport={() => setImportOpen(true)}
        onOpenBookmarks={() => setBookmarksOpen(true)}
        onOpenTags={(id) => setTagsOpen(id)}
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
              <ModelSelector
                currentModel={session.model}
                currentProviderId={session.providerId}
                onSelect={(providerId, modelId) => {
                  // Set model and provider on the session
                  useChatStore.setState((state) => ({
                    sessions: state.sessions.map((s) =>
                      s.id === activeId ? { ...s, model: modelId as ModelName, providerId, updatedAt: new Date().toISOString() } : s
                    ),
                  }));
                  const updated = useChatStore.getState().sessions.find((s) => s.id === activeId);
                  if (updated) saveSession(updated);
                }}
                minimal
              />
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Template selector */}
            <button
              onClick={() => { playClick(); setTemplateSelectorOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-amber-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="对话模板"
            >
              <Bot className="w-4 h-4" />
            </button>

            {/* Timeline toggle */}
            <button
              onClick={() => { playClick(); setTimelineMode((v) => !v); }}
              className={`p-1.5 rounded-lg transition-colors ${
                timelineMode
                  ? darkMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-indigo-600 bg-indigo-50'
                  : darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-cyan-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={timelineMode ? '时间线视图 (已开启)' : '时间线视图'}
            >
              <CalendarClock className="w-4 h-4" />
            </button>

            {/* A/B comparison */}
            <button
              onClick={() => { playClick(); setComparisonOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="模型对比"
            >
              <GitCompare className="w-4 h-4" />
            </button>

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
            {/* Global search */}
            <button
              onClick={() => { playClick(); setGlobalSearchOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-amber-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="全局搜索 (Ctrl+Shift+F)"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleExport('md')}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-cyan-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="导出 Markdown (Ctrl+Shift+E)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-emerald-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="导出 JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleExportImage('png')}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-amber-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="导出为图片"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleShare}
              disabled={activeMessages.length === 0}
              className={`px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'text-gray-400 hover:text-purple-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title={t('share.title')}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { playClick(); setKnowledgeOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-cyan-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={t('knowledge.knowledgeBase')}
            >
              <Database className="w-4 h-4" />
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
              onClick={() => { playClick(); setAboutOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="关于"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playClick(); setShortcutOpen(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-cyan-400' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="帮助 (Ctrl+/)"
            >
              <HelpCircle className="w-4 h-4" />
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

        {/* Context window usage bar */}
        <ContextBar
          totalTokens={totalTokens}
          maxTokens={settings.maxTokens}
          contextLimit={settings.contextLimit}
          messageCount={activeMessages.length}
        />

        {/* Messages */}
        {/* Message search bar */}
        {messageSearch !== undefined && (
          <div className={`px-4 py-2 z-10 ${darkMode ? 'bg-black/20 border-b border-white/[0.04]' : 'bg-gray-50/50 border-b border-gray-200'}`}>
            <div className="max-w-3xl mx-auto">
              <input
                data-search-input
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="搜索对话内容… (Ctrl+F)"
                className={`w-full px-3 py-1.5 rounded-lg text-xs outline-none transition-all ${
                  darkMode
                    ? 'bg-white/[0.04] border border-white/[0.06] focus:border-cyan-500/30 text-white/70 placeholder-gray-600'
                    : 'bg-white border border-gray-200 focus:border-indigo-300 text-gray-700 placeholder-gray-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* Messages area with scroll navigator */}
        <div ref={messageAreaRef} className="relative flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
            <MessageList
              ref={messageListRef}
              messages={activeMessages}
              onSend={handleSend}
              editingMsgId={editingMsgId}
              onEdit={handleEdit}
              onStartEdit={setEditingMsgId}
              onCancelEdit={() => setEditingMsgId(null)}
              searchQuery={messageSearch}
              sessionId={activeId || undefined}
              sessionTitle={session?.title}
              onPreviewCode={(code, lang) => setArtifactCode({ code, lang })}
              onBranch={handleBranch}
              onReply={handleReply}
              timelineMode={timelineMode}
            />
          </div>
          {/* Right-side scroll navigator */}
          {activeMessages.length >= 3 && (
            <div className={`flex items-center py-2 pr-1.5 ${
              darkMode ? 'opacity-60 hover:opacity-100' : 'opacity-40 hover:opacity-70'
            } transition-opacity duration-200`}>
              <ScrollNavigator
                containerRef={messageAreaRef}
                darkMode={darkMode}
                messageCount={activeMessages.length}
              />
            </div>
          )}
        </div>

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
          onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
          replyTo={replyTarget ? { message: replyTarget, onClear: () => setReplyTarget(null) } : undefined}
        />
      </div>

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => { playClick(); setSettingsOpen(false); }} />

      {/* Usage stats panel */}
      <UsagePanel open={usageOpen} onClose={() => { playClick(); setUsageOpen(false); }} />

      {/* Shortcut help */}
      <ShortcutHelp open={shortcutOpen} onClose={() => { playClick(); setShortcutOpen(false); }} />

      {/* About panel */}
      <AboutPanel open={aboutOpen} onClose={() => { playClick(); setAboutOpen(false); }} />

      {/* Template selector */}
      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => { playClick(); setTemplateSelectorOpen(false); }}
        onSelect={handleTemplateSelect}
        darkMode={darkMode}
      />

      {/* Model comparison panel */}
      {comparisonOpen && (
        <ComparisonPanel
          open={comparisonOpen}
          onClose={() => { playClick(); setComparisonOpen(false); }}
          darkMode={darkMode}
        />
      )}

      {/* Prompt library */}
      <PromptLibrary
        open={promptLibraryOpen}
        onClose={() => { playClick(); setPromptLibraryOpen(false); }}
        onSelect={handlePromptSelect}
        darkMode={darkMode}
      />

      {/* Share panel */}
      {shareOpen && session && (
        <SharePanel session={session} onClose={() => setShareOpen(false)} />
      )}

      {/* Import dialog */}
      {importOpen && (
        <ImportDialog onClose={() => setImportOpen(false)} />
      )}

      {/* Artifact preview */}
      {artifactCode && (
        <ArtifactPreview
          code={artifactCode.code}
          language={artifactCode.lang}
          onClose={() => setArtifactCode(null)}
        />
      )}

      {/* Knowledge base panel */}
      {knowledgeOpen && (
        <KnowledgeBasePanel onClose={() => setKnowledgeOpen(false)} />
      )}

      {/* Tags panel */}
      {tagsOpen && (
        <TagsPanel
          tags={session?.tags || []}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClose={() => setTagsOpen(null)}
        />
      )}

      {/* Global search dialog */}
      {globalSearchOpen && (
        <GlobalSearch
          onClose={() => setGlobalSearchOpen(false)}
          onNavigate={(sessionId) => useChatStore.getState().switchSession(sessionId)}
        />
      )}
    </div>
  );
}
