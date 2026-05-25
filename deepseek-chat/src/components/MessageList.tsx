import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { MessageItem } from './MessageItem';
import { Sparkles, Cpu, Zap, ChevronRight, Brain, Code2, Globe } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

interface MessageListProps {
  messages: ChatMessage[];
  onSend?: (content: string) => void;
  editingMsgId?: string | null;
  onEdit?: (msgId: string, newContent: string) => void;
  onStartEdit?: (msgId: string) => void;
  onCancelEdit?: () => void;
}

const SUGGESTIONS = [
  { icon: '🧬', label: '解释量子纠缠', prompt: '用通俗易懂的方式解释量子纠缠' },
  { icon: '🔮', label: '预测科技趋势', prompt: '预测未来5年最重要的10项科技突破' },
  { icon: '🧠', label: '设计算法', prompt: '设计一个高效的分布式缓存系统架构' },
  { icon: '⚡', label: '代码重构', prompt: '帮我重构以下代码，提升性能和可维护性' },
  { icon: '🌐', label: '技术对比', prompt: '对比 React Server Components 与传统 SSR 的优劣' },
  { icon: '💎', label: '架构设计', prompt: '为百万级用户的 SaaS 产品设计技术架构方案' },
];

export function MessageList({ messages, onSend, editingMsgId, onEdit, onStartEdit, onCancelEdit }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center overflow-y-auto ${
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
          {/* Logo with glow effect */}
          <div className="mb-10">
            <div className="relative inline-flex mb-6">
              {/* Glow ring */}
              {darkMode && (
                <div className="absolute -inset-4 rounded-full opacity-30">
                  <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400" style={{ animation: 'spin 8s linear infinite' }} />
                </div>
              )}
              <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${
                darkMode
                  ? 'gradient-cyber shadow-[0_0_40px_rgba(0,229,255,0.25),0_0_80px_rgba(179,102,255,0.1)]'
                  : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/25'
              }`}>
                <Sparkles className="w-9 h-9 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              <span className={darkMode ? 'text-white/95' : 'text-gray-900'}>DeepSeek</span>
              {' '}
              <span className={`text-transparent bg-clip-text ${
                darkMode
                  ? 'bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}>
                Chatbox
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-sm max-w-md mx-auto leading-relaxed mb-5 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              新一代 AI 对话终端 · 流式输出 · 深度推理 · 代码着色 · LaTeX 公式
            </p>

            {/* Feature badges */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {[
                { icon: Cpu, label: 'DeepSeek V4', color: 'cyan' },
                { icon: Zap, label: 'Flash', color: 'emerald' },
                { icon: Brain, label: '深度思考', color: 'purple' },
                { icon: Code2, label: 'Code Highlight', color: 'blue' },
                { icon: Globe, label: 'SSE Stream', color: 'indigo' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
                    darkMode
                      ? `bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] text-gray-400 hover:text-white/70`
                      : 'bg-white border border-gray-200 shadow-sm text-gray-500'
                  }`}
                  style={darkMode ? ({
                    '--hover-glow': item.color === 'cyan'
                      ? 'rgba(0,229,255,0.15)'
                      : item.color === 'purple'
                        ? 'rgba(179,102,255,0.15)'
                        : item.color === 'emerald'
                          ? 'rgba(0,255,136,0.15)'
                          : 'rgba(68,136,255,0.15)',
                  }) as React.CSSProperties : undefined}
                >
                  <item.icon className={`w-3 h-3 ${darkMode && (
                    item.color === 'cyan' ? 'text-cyan-400/60' :
                    item.color === 'purple' ? 'text-purple-400/60' :
                    item.color === 'emerald' ? 'text-emerald-400/60' :
                    item.color === 'blue' ? 'text-blue-400/60' :
                    'text-indigo-400/60'
                  )}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`flex items-center gap-3 my-8 ${darkMode ? '' : ''}`}>
            <div className={`flex-1 h-px ${darkMode ? 'bg-white/[0.05]' : 'bg-gray-200'}`} />
            <span className={`text-[10px] uppercase tracking-[0.2em] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              快速开始
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-white/[0.05]' : 'bg-gray-200'}`} />
          </div>

          {/* Quick suggestions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                onClick={() => onSend?.(item.prompt)}
                className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                  darkMode
                    ? 'bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/25 hover:bg-cyan-500/[0.03] hover:shadow-[0_0_16px_rgba(0,229,255,0.04)]'
                    : 'bg-white/70 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm hover:shadow-md'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-medium transition-colors ${
                    darkMode
                      ? 'text-white/75 group-hover:text-cyan-300'
                      : 'text-gray-700 group-hover:text-indigo-600'
                  }`}>{item.label}</div>
                  <div className={`text-[11px] mt-0.5 truncate ${
                    darkMode ? 'text-gray-600' : 'text-gray-400'
                  }`}>{item.prompt}</div>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                  darkMode
                    ? 'opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 text-cyan-400/50'
                    : 'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 text-indigo-400'
                }`} />
              </button>
            ))}
          </div>

          {/* Status indicator */}
          <div className={`mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs ${
            darkMode
              ? 'bg-white/[0.02] border border-emerald-500/10 text-gray-500'
              : 'bg-white border border-gray-200 shadow-sm text-gray-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-green-500'} animate-pulse`} />
            DeepSeek V4 API · 在线可用
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
        >
          <MessageItem
            message={msg}
            isEditing={editingMsgId === msg.id}
            onEdit={onEdit}
            onStartEdit={msg.role === 'user' ? onStartEdit : undefined}
            onCancelEdit={onCancelEdit}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
