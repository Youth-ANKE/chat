import { Bot, User, AlertCircle, Copy, Check, Pencil, Brain, ChevronDown, ChevronUp, Image, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick, playSave } from '../lib/sound';

interface MessageItemProps {
  message: ChatMessage;
  isEditing?: boolean;
  onEdit?: (msgId: string, newContent: string) => void;
  onStartEdit?: (msgId: string) => void;
  onCancelEdit?: () => void;
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  );
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return '刚刚';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Collapsible thinking / reasoning block */
function ThinkingBlock({ reasoning, isStreaming }: { reasoning: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasContent = !!reasoning;

  if (!hasContent && !isStreaming) return null;

  return (
    <div className={`mb-3 rounded-xl border overflow-hidden ${
      expanded
        ? 'border-purple-500/20 bg-purple-500/[0.04]'
        : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      {/* Header */}
      <button
        onClick={() => { playClick(); setExpanded(!expanded); }}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.02] group/think"
      >
        <Brain className={`w-4 h-4 flex-shrink-0 ${isStreaming ? 'text-purple-400 animate-pulse' : 'text-purple-400/70'}`} />
        <span className={`text-xs font-semibold tracking-wide ${
          isStreaming ? 'text-purple-300' : 'text-purple-400/80'
        }`}>
          {isStreaming ? '深度思考中...' : `思考过程 (${(reasoning?.length ?? 0).toLocaleString()} 字)`}
        </span>
        {isStreaming && <ThinkingDots />}
        <div className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-gray-500 group-hover/think:text-gray-400 transition-colors" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover/think:text-gray-400 transition-colors" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && hasContent && (
        <div className="px-4 pb-3.5 pt-0 border-t border-white/[0.03]">
          <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap font-mono max-h-[360px] overflow-y-auto custom-scrollbar">
            {reasoning}
            {isStreaming && (
              <span className="streaming-cursor ml-0.5 align-middle" style={{
                background: 'linear-gradient(180deg, #b366ff, #8b5cf6)',
              }} />
            )}
          </div>
        </div>
      )}

      {!expanded && hasContent && (
        <div className="px-4 pb-2.5 pt-0">
          <p className="text-xs text-gray-600 truncate font-mono">{reasoning}</p>
        </div>
      )}
    </div>
  );
}

export function MessageItem({ message, isEditing, onEdit, onStartEdit, onCancelEdit }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const darkMode = useSettingsStore((s) => s.settings.darkMode);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreaming = message.status === 'streaming';
  const hasError = message.status === 'error';
  const hasContent = !!message.content;
  const hasReasoning = !!(message.reasoning && message.reasoning.length > 0);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  if (isSystem) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = () => {
    const trimmed = editContent.trim();
    if (trimmed && onEdit) {
      playSave();
      onEdit(message.id, trimmed);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      onCancelEdit?.();
    }
  };

  // ── Theme-aware classes ──
  const bgClass = darkMode
    ? isUser ? 'bg-white/[0.02]' : ''
    : isUser ? 'bg-indigo-50/40' : '';

  const avatarClass = isUser
    ? darkMode
      ? 'gradient-purple text-white ring-purple-400/20 shadow-[0_0_10px_rgba(179,102,255,0.15)]'
      : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md'
    : hasError
    ? darkMode
      ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 ring-red-400/20'
      : 'bg-gradient-to-br from-red-100 to-red-200 text-red-600'
    : darkMode
    ? 'gradient-cyan text-white ring-cyan-400/20 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
    : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md';

  const roleLabelClass = isUser
    ? darkMode ? 'text-purple-400' : 'text-indigo-600 font-bold'
    : hasError
    ? 'text-red-400'
    : darkMode ? 'text-cyan-400' : 'text-cyan-600 font-semibold';

  const timeClass = darkMode ? 'text-[11px] text-white/25' : 'text-[11px] text-gray-400';
  const bodyTextClass = darkMode ? 'text-white/85' : 'text-gray-800';
  const emptyClass = darkMode ? 'text-gray-500 text-sm italic' : 'text-gray-400 text-sm italic';
  const editInputClass = darkMode
    ? 'w-full resize-none rounded-lg bg-white/[0.04] border border-cyan-500/20 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 px-3 py-2 text-sm text-white/90 placeholder-gray-600 transition-all'
    : 'w-full resize-none rounded-lg bg-white border border-gray-200 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-all';
  const saveBtnClass = darkMode
    ? 'px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 disabled:opacity-30 transition-colors'
    : 'px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs hover:bg-indigo-600 disabled:opacity-30 transition-colors';
  const cancelBtnClass = darkMode
    ? 'px-3 py-1 rounded-lg hover:bg-white/[0.04] text-gray-400 text-xs transition-colors'
    : 'px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-500 text-xs transition-colors';
  const actionBtnClass = darkMode
    ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/40 hover:text-purple-400 hover:bg-white/[0.04] transition-colors'
    : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition-colors';
  const copyBtnClass = darkMode
    ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/40 hover:text-cyan-400 hover:bg-white/[0.04] transition-colors'
    : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-cyan-600 hover:bg-gray-100 transition-colors';

  return (
    <div className={`group flex gap-3 px-4 sm:px-6 py-5 transition-colors duration-200 ${bgClass}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ring-1 ${avatarClass}`}>
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : hasError ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-semibold ${roleLabelClass}`}>
            {isUser ? '你' : hasError ? '错误' : 'DeepSeek'}
          </span>
          {message.createdAt && (
            <span className={timeClass}>{formatTime(message.createdAt)}</span>
          )}
          {hasReasoning && !isStreaming && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${
              darkMode ? 'bg-purple-500/10 text-purple-400/70' : 'bg-purple-100 text-purple-500'
            }`}>
              <Brain className="w-2.5 h-2.5" />
              已深度思考
            </span>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={editRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={3}
              className={editInputClass}
              placeholder="编辑消息..."
            />
            <div className="flex items-center gap-2">
              <button onClick={handleEditSubmit} disabled={!editContent.trim()} className={saveBtnClass}>
                保存并重新发送
              </button>
              <button onClick={onCancelEdit} className={cancelBtnClass}>取消</button>
            </div>
          </div>
        ) : (
          <div className={`text-message leading-7 ${bodyTextClass}`}>
            {/* Thinking block for assistant messages */}
            {!isUser && (hasReasoning || isStreaming) && (
              <ThinkingBlock reasoning={message.reasoning ?? ''} isStreaming={isStreaming} />
            )}

            {/* Attachment previews for user messages */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                      darkMode
                        ? 'bg-white/[0.04] border border-white/[0.08]'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {att.type === 'image' ? (
                      <img src={att.data} alt={att.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                    ) : (
                      <FileText className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                    )}
                    <span className={`max-w-[140px] truncate ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                      {att.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hasError ? (
              <div className={`${darkMode ? 'text-red-400' : 'text-red-600'} text-sm`}>
                {message.error ?? '回复失败，请重试'}
              </div>
            ) : hasContent ? (
              <MarkdownRenderer content={message.content} />
            ) : isStreaming ? (
              /* When streaming with no content yet, ThinkingBlock above already shows state */
              <ThinkingDots />
            ) : (
              <span className={emptyClass}>（空回复）</span>
            )}
            {isStreaming && hasContent && (
              <span className="inline-block streaming-cursor ml-0.5 align-middle" />
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isStreaming && hasContent && !isEditing && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {isUser && onStartEdit && (
              <button onClick={() => { playClick(); setEditContent(message.content); onStartEdit(message.id); }} className={actionBtnClass} title="编辑消息">
                <Pencil className="w-3 h-3" />编辑
              </button>
            )}
            <button onClick={handleCopy} className={copyBtnClass} title="复制消息">
              {copied ? <><Check className="w-3 h-3" /><span>已复制</span></> : <><Copy className="w-3 h-3" /><span>复制</span></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
