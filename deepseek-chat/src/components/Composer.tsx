import { useState, useRef, useEffect, forwardRef, type KeyboardEvent } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';
import type { ModelName } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

interface ComposerProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  model?: ModelName;
}

const MODEL_LABELS: Record<ModelName, string> = {
  'deepseek-v4-flash': 'V4 Flash',
  'deepseek-v4-pro': 'V4 Pro',
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(
  function Composer({ onSend, onStop, isStreaming, disabled, model }, ref) {
    const [input, setInput] = useState('');
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || innerRef;
    const darkMode = useSettingsStore((s) => s.settings.darkMode);
    const charCount = input.length;
    const tokenEstimate = estimateTokens(input);

    // Merge refs
    useEffect(() => {
      if (typeof textareaRef === 'function') textareaRef(innerRef.current);
      else if (textareaRef) (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = innerRef.current;
    }, [textareaRef]);

    // Auto-resize
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [input]);

    // Focus on mount
    useEffect(() => { innerRef.current?.focus(); }, []);

    const handleSend = () => {
      const trimmed = input.trim();
      if (!trimmed || isStreaming || disabled) return;
      onSend(trimmed);
      setInput('');
      if (innerRef.current) innerRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
      <div className={`border-t px-4 py-3 z-10 flex-shrink-0 ${
        darkMode ? 'glass border-white/5' : 'bg-white/80 border-gray-200/80 backdrop-blur-md'
      }`}>
        <div className="max-w-3xl mx-auto">
          {/* Input area */}
          <div className={`relative flex items-end gap-2.5 rounded-2xl px-4 py-3 transition-all duration-300 ${
            darkMode
              ? isStreaming
                ? `bg-purple-500/[0.04] border border-purple-500/25 shadow-[0_0_20px_rgba(179,102,255,0.08)]`
                : `bg-white/[0.03] border border-white/[0.06] focus-within:border-cyan-500/35 focus-within:shadow-[0_0_24px_rgba(0,229,255,0.07)] focus-within:bg-white/[0.04]`
              : 'bg-gray-100/80 border border-gray-200 rounded-xl focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/20'
          }`}>
            {/* Terminal prompt for dark mode */}
            {darkMode && (
              <span className="text-emerald-400 text-sm font-mono flex-shrink-0 pb-1 select-none opacity-70">❯</span>
            )}
            <textarea
              ref={innerRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? '⚡ 正在生成回复…'
                  : disabled
                    ? '编辑模式中…'
                  : '输入消息，Enter 发送，Shift+Enter 换行'
              }
              disabled={disabled || isStreaming}
              className={`flex-1 resize-none bg-transparent text-sm outline-none max-h-[200px] py-1 leading-relaxed ${
                darkMode
                  ? 'text-white/85 placeholder-gray-600'
                  : 'text-gray-800 placeholder-gray-400'
              }`}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                disabled
                className={`p-1.5 rounded-lg cursor-not-allowed transition-colors ${
                  darkMode ? 'text-white/[0.04]' : 'text-gray-200'
                }`}
                title="附件（即将推出）"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    darkMode
                      ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.15)] hover:shadow-[0_0_16px_rgba(239,68,68,0.25)]'
                      : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                  }`}
                  title="停止生成"
                >
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || disabled}
                  className={`p-1.5 rounded-xl transition-all duration-200 disabled:opacity-15 disabled:cursor-not-allowed ${
                    darkMode
                      ? input.trim()
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_14px_rgba(0,229,255,0.2)] hover:shadow-[0_0_22px_rgba(0,229,255,0.3)]'
                        : 'bg-transparent text-gray-600'
                      : input.trim()
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        : 'bg-transparent text-gray-300'
                  }`}
                  title="发送 (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Footer info bar */}
          <div className="flex items-center justify-between mt-2.5 px-1">
            <div className="flex items-center gap-2.5">
              {model && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  darkMode
                    ? 'bg-white/[0.03] border border-white/[0.05] text-cyan-400/60'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    darkMode
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(0,255,136,0.5)] animate-pulse'
                      : 'bg-emerald-500'
                  }`} />
                  {MODEL_LABELS[model] ?? model}
                </span>
              )}
              {isStreaming && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${
                  darkMode ? 'text-purple-400/60' : 'text-indigo-500'
                }`}>
                  <div className="relative w-1.5 h-1.5">
                    <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping" />
                    <div className="absolute inset-0 rounded-full bg-purple-400" />
                  </div>
                  思考中…
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <span className={`text-[11px] tabular-nums font-mono ${
                  darkMode ? 'text-cyan-400/40' : 'text-gray-400'
                }`}>
                  ≈{tokenEstimate.toLocaleString()} tokens
                </span>
              )}
              <span className={`text-[11px] ${
                darkMode ? 'text-gray-700' : 'text-gray-400'
              }`}>DeepSeek V4</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
