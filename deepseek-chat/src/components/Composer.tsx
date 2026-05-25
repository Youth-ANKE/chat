import { useState, useRef, useEffect, forwardRef, type KeyboardEvent } from 'react';
import { Send, Square, Paperclip, Globe, X, Image, FileText } from 'lucide-react';
import type { ModelName } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick, playDelete } from '../lib/sound';

interface ComposerProps {
  onSend: (
    content: string,
    attachments?: { type: 'image' | 'text'; mimeType: string; data: string; name: string }[]
  ) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  model?: ModelName;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
}

interface PendingFile {
  id: string;
  name: string;
  type: 'image' | 'text';
  mimeType: string;
  data: string;
  size: number;
}

const MODEL_LABELS: Record<ModelName, string> = {
  'deepseek-v4-flash': 'V4 Flash',
  'deepseek-v4-pro': 'V4 Pro',
};

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const TEXT_TYPES = [
  'text/plain', 'text/markdown', 'text/csv', 'text/xml',
  'application/json', 'application/javascript', 'application/typescript',
  'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',
  'text/x-go', 'text/x-rust', 'application/x-yaml', 'text/html',
  'text/css', 'application/xml',
];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(
  function Composer({ onSend, onStop, isStreaming, disabled, model, webSearch, onToggleWebSearch }, ref) {
    const [input, setInput] = useState('');
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      for (const file of files) {
        const reader = new FileReader();

        if (IMAGE_TYPES.includes(file.type)) {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setPendingFiles((prev) => [
                ...prev,
                {
                  id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: file.name,
                  type: 'image',
                  mimeType: file.type,
                  data: reader.result as string,
                  size: file.size,
                },
              ]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setPendingFiles((prev) => [
                ...prev,
                {
                  id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: file.name,
                  type: 'text',
                  mimeType: file.type,
                  data: reader.result as string,
                  size: file.size,
                },
              ]);
            }
          };
          reader.readAsText(file);
        }
      }

      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (id: string) => {
      playDelete();
      setPendingFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSend = () => {
      const trimmed = input.trim();
      const hasFiles = pendingFiles.length > 0;
      if ((!trimmed && !hasFiles) || isStreaming || disabled) return;
      onSend(
        trimmed,
        hasFiles
          ? pendingFiles.map((f) => ({
              type: f.type,
              mimeType: f.mimeType,
              data: f.data,
              name: f.name,
            }))
          : undefined
      );
      setInput('');
      setPendingFiles([]);
      if (innerRef.current) innerRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const totalSize = pendingFiles.reduce((s, f) => s + f.size, 0);

    return (
      <div className={`border-t px-4 py-3 z-10 flex-shrink-0 ${
        darkMode ? 'glass border-white/5' : 'bg-white/80 border-gray-200/80 backdrop-blur-md'
      }`}>
        <div className="max-w-3xl mx-auto">
          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {pendingFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs group ${
                    darkMode
                      ? 'bg-white/[0.04] border border-white/[0.08]'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {file.type === 'image' ? (
                    <>
                      <Image className={`w-3.5 h-3.5 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                      <img src={file.data} alt={file.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    </>
                  ) : (
                    <FileText className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                  )}
                  <span className={`max-w-[120px] truncate ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                    {file.name}
                  </span>
                  <span className={`${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className={`ml-0.5 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-500'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalSize > 0 && (
                <span className={`text-[10px] ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                  共 {pendingFiles.length} 个文件 · {formatSize(totalSize)}
                </span>
              )}
            </div>
          )}

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
                  : pendingFiles.length > 0
                    ? '输入消息（可选），Enter 发送 · Shift+Enter 换行'
                    : '输入消息，Enter 发送，Shift+Enter 换行'
              }
              disabled={disabled || isStreaming}
              className={`flex-1 resize-none bg-transparent text-sm outline-none max-h-[200px] py-1 leading-relaxed ${
                darkMode
                  ? 'text-white/85 placeholder-gray-600'
                  : 'text-gray-800 placeholder-gray-400'
              }`}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={[...IMAGE_TYPES, ...TEXT_TYPES].join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Upload file */}
              <button
                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                disabled={isStreaming || disabled}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'text-white/35 hover:text-cyan-400 hover:bg-white/[0.06]'
                    : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-200/60'
                }`}
                title="上传文件（图片、代码、文本）"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Web search toggle */}
              <button
                onClick={onToggleWebSearch}
                disabled={isStreaming || disabled}
                className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${
                  webSearch
                    ? 'px-2 py-2 ' + (darkMode
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40 shadow-[0_0_14px_rgba(0,255,136,0.25)]'
                      : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400/40')
                    : 'px-2 py-2 ' + (darkMode
                      ? 'text-white/25 hover:text-white/50 hover:bg-white/[0.06]'
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-200/60')
                }`}
                title={webSearch ? '关闭联网搜索' : '开启联网搜索'}
              >
                <Globe className={`w-4 h-4 ${webSearch ? 'fill-emerald-400/30' : ''}`} />
                {webSearch && (
                  <span className="text-[11px] font-medium whitespace-nowrap">联网</span>
                )}
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
                  disabled={(!input.trim() && pendingFiles.length === 0) || disabled}
                  className={`p-1.5 rounded-xl transition-all duration-200 disabled:opacity-15 disabled:cursor-not-allowed ${
                    darkMode
                      ? (input.trim() || pendingFiles.length > 0)
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_14px_rgba(0,229,255,0.2)] hover:shadow-[0_0_22px_rgba(0,229,255,0.3)]'
                        : 'bg-transparent text-gray-600'
                      : (input.trim() || pendingFiles.length > 0)
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
              {webSearch && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                  darkMode
                    ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/15'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Globe className="w-2.5 h-2.5" />
                  联网搜索
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
