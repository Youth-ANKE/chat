import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import type { ChatMessage } from '../types';
import { MessageItem } from './MessageItem';
import { Sparkles, Cpu, Zap, ChevronRight, Brain, Code2, Globe, SearchX } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export interface MessageListHandle {
  /** The scrollable container element */
  scrollTop: (value?: number) => number;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

interface MessageListProps {
  messages: ChatMessage[];
  onSend?: (content: string) => void;
  editingMsgId?: string | null;
  onEdit?: (msgId: string, newContent: string) => void;
  onStartEdit?: (msgId: string) => void;
  onCancelEdit?: () => void;
  searchQuery?: string;
  sessionId?: string;
  sessionTitle?: string;
  onPreviewCode?: (code: string, lang: string) => void;
  onBranch?: (msgId: string) => void;
  onReply?: (msg: ChatMessage) => void;
  /** For timeline grouping */
  timelineMode?: boolean;
}

const SUGGESTIONS = [
  { icon: '🧬', label: '解释量子纠缠', prompt: '用通俗易懂的方式解释量子纠缠' },
  { icon: '🔮', label: '预测科技趋势', prompt: '预测未来5年最重要的10项科技突破' },
  { icon: '🧠', label: '设计算法', prompt: '设计一个高效的分布式缓存系统架构' },
  { icon: '⚡', label: '代码重构', prompt: '帮我重构以下代码，提升性能和可维护性' },
  { icon: '🌐', label: '技术对比', prompt: '对比 React Server Components 与传统 SSR 的优劣' },
  { icon: '💎', label: '架构设计', prompt: '为百万级用户的 SaaS 产品设计技术架构方案' },
];

export const MessageList = forwardRef<MessageListHandle, MessageListProps>(
function MessageList({ messages, onSend, editingMsgId, onEdit, onStartEdit, onCancelEdit, searchQuery, sessionId, sessionTitle, onPreviewCode, onBranch, onReply, timelineMode }, ref) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  // Expose scroll control methods to parent
  useImperativeHandle(ref, () => ({
    scrollTop(value?: number): number {
      const el = scrollContainerRef.current;
      if (!el) return 0;
      if (value !== undefined) { el.scrollTop = value; return value; }
      return el.scrollTop;
    },
    scrollToTop() {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    scrollToBottom() {
      scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    },
  }), []);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery?.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => {
      const inContent = m.content.toLowerCase().includes(q);
      const inReasoning = m.reasoning?.toLowerCase().includes(q);
      const inAttachments = m.attachments?.some((a) => a.name.toLowerCase().includes(q));
      return inContent || inReasoning || inAttachments;
    });
  }, [messages, searchQuery]);

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages]);

  // Detect user scroll-up to suppress auto-scroll during streaming
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      userScrolledUpRef.current = !nearBottom;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Reset scroll lock when messages are empty (new session)
  useEffect(() => {
    if (messages.length === 0) userScrolledUpRef.current = false;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div ref={scrollContainerRef} className={`flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar ${
        darkMode ? 'tech-grid relative' : 'bg-gray-50/50'
      }`}>
        {/* Radial glow background for dark mode */}
        {darkMode && (
          <>
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/[0.03] rounded-full blur-3xl" />
          </>
        )}

        <div className="text-center max-w-2xl w-full animate-fade-in-up px-4 py-12">
          {/* Logo with subtle glow */}
          <div className="mb-10">
            <div className="relative inline-flex mb-6">
              {/* Subtle halo */}
              {darkMode && (
                <div className="absolute -inset-6 rounded-full opacity-15">
                  <div className="absolute inset-0 rounded-full blur-2xl bg-gradient-to-r from-white/20 via-blue-200/10 to-purple-200/10" style={{ animation: 'spin 12s linear infinite' }} />
                </div>
              )}
              <div className={`relative w-20 h-20 rounded-[22px] flex items-center justify-center overflow-hidden ${
                darkMode
                  ? 'bg-white/[0.06] backdrop-blur-md border border-white/[0.08] shadow-[0_0_60px_rgba(200,220,255,0.08),0_0_120px_rgba(200,220,255,0.04)]'
                  : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/15'
              }`}>
                <Sparkles className={`w-9 h-9 ${darkMode ? 'text-white/70' : 'text-white'}`} />
                {darkMode && (
                  <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              <span className={darkMode ? 'text-white/90' : 'text-gray-900'}>DeepSeek</span>
              {' '}
              <span className={`text-transparent bg-clip-text ${
                darkMode
                  ? 'bg-gradient-to-r from-white/50 via-blue-200 to-purple-200'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}>
                Chatbox
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-sm max-w-md mx-auto leading-relaxed mb-5 ${
              darkMode ? 'text-white/25' : 'text-gray-400'
            }`}>
              新一代 AI 对话终端 · 流式输出 · 深度推理 · 代码着色 · LaTeX 公式
            </p>

            {/* Feature badges */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {[
                { icon: Cpu, label: 'DeepSeek V4' },
                { icon: Zap, label: 'Flash' },
                { icon: Brain, label: '深度思考' },
                { icon: Code2, label: 'Code Highlight' },
                { icon: Globe, label: 'SSE Stream' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
                    darkMode
                      ? `glass-pill text-white/30 hover:text-white/50 hover:border-white/[0.1] cursor-default`
                      : 'bg-white border border-gray-200 shadow-sm text-gray-500'
                  }`}
                >
                  <item.icon className={`w-3 h-3 ${darkMode ? 'text-white/25' : ''}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`flex items-center gap-3 my-8`}>
            <div className={`flex-1 h-px ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
            <span className={`text-[10px] uppercase tracking-[0.2em] ${darkMode ? 'text-white/15' : 'text-gray-400'}`}>
              快速开始
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
          </div>

          {/* Quick suggestions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                onClick={() => onSend?.(item.prompt)}
                className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 hover-lift ${
                  darkMode
                    ? 'glass-card border-white/[0.04]'
                    : 'bg-white/70 border border-gray-200 hover:border-gray-300 hover:bg-white shadow-sm'
                }`}
              >
                <span className="text-lg flex-shrink-0 opacity-80">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-medium transition-colors ${
                    darkMode
                      ? 'text-white/65 group-hover:text-white/85'
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>{item.label}</div>
                  <div className={`text-[11px] mt-0.5 truncate ${
                    darkMode ? 'text-white/20' : 'text-gray-400'
                  }`}>{item.prompt}</div>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                  darkMode
                    ? 'opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 text-white/20'
                    : 'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 text-indigo-400'
                }`} />
              </button>
            ))}
          </div>

          {/* Status indicator */}
          <div className={`mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs ${
            darkMode
              ? 'glass-pill text-white/25 border-white/[0.06]'
              : 'bg-white border border-gray-200 shadow-sm text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-white/40 shadow-[0_0_6px_rgba(255,255,255,0.15)]' : 'bg-green-500'} animate-pulse`} />
            DeepSeek V4 API · 在线可用
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
      {filteredMessages.length === 0 && searchQuery?.trim() ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
          <SearchX className="w-10 h-10 opacity-20" />
          <span className="text-sm">未找到匹配的消息</span>
          <span className="text-xs text-gray-600">尝试其他关键词</span>
        </div>
      ) : timelineMode ? (
        (() => {
          const groups: { date: string; msgs: ChatMessage[] }[] = [];
          for (const msg of filteredMessages) {
            const dateStr = new Date(msg.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
            const last = groups[groups.length - 1];
            if (last?.date === dateStr) { last.msgs.push(msg); }
            else { groups.push({ date: dateStr, msgs: [msg] }); }
          }
          return groups.map((group, gi) => (
            <div key={gi}>
              <div className={`flex items-center gap-2 px-4 py-2 sticky top-0 z-10 backdrop-blur ${darkMode ? 'bg-black/80' : 'bg-white/80'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{group.date}</span>
                <span className="text-[9px] text-gray-700">{group.msgs.length} 条</span>
              </div>
              {group.msgs.map((msg, i) => (
                <div key={msg.id} className="animate-message-in" style={{ animationDelay: `${Math.min(i * 10, 150)}ms` }}>
                  <MessageItem
                    message={msg}
                    allMessages={messages}
                    isEditing={editingMsgId === msg.id}
                    onEdit={onEdit}
                    onStartEdit={msg.role === 'user' ? onStartEdit : undefined}
                    onCancelEdit={onCancelEdit}
                    onReply={onReply}
                    searchHighlight={searchQuery?.trim()}
                    sessionId={sessionId}
                    sessionTitle={sessionTitle}
                    onPreviewCode={onPreviewCode}
                    onBranch={msg.role === 'user' ? onBranch : undefined}
                  />
                </div>
              ))}
            </div>
          ));
        })()
      ) : (
        filteredMessages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-message-in"
            style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
          >
            <MessageItem
              message={msg}
              allMessages={messages}
              isEditing={editingMsgId === msg.id}
              onEdit={onEdit}
              onStartEdit={msg.role === 'user' ? onStartEdit : undefined}
              onCancelEdit={onCancelEdit}
              onReply={onReply}
              searchHighlight={searchQuery?.trim()}
              sessionId={sessionId}
              sessionTitle={sessionTitle}
              onPreviewCode={onPreviewCode}
              onBranch={msg.role === 'user' ? onBranch : undefined}
            />
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
);
